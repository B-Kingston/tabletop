package database

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

const migrationSafetyBaselineVersion = 6

var destructiveMigrationPatterns = []struct {
	name    string
	pattern *regexp.Regexp
}{
	{name: "DROP TABLE", pattern: regexp.MustCompile(`(?i)\bdrop\s+table\b`)},
	{name: "DROP COLUMN", pattern: regexp.MustCompile(`(?i)\bdrop\s+column\b`)},
	{name: "TRUNCATE", pattern: regexp.MustCompile(`(?i)\btruncate\b`)},
	{name: "DELETE FROM", pattern: regexp.MustCompile(`(?i)\bdelete\s+from\b`)},
	{name: "ALTER COLUMN TYPE", pattern: regexp.MustCompile(`(?i)\balter\s+column\b.+\btype\b`)},
	{name: "ON DELETE CASCADE", pattern: regexp.MustCompile(`(?i)\bon\s+delete\s+cascade\b`)},
	{name: "DROP CONSTRAINT", pattern: regexp.MustCompile(`(?i)\bdrop\s+constraint\b`)},
}

var requiredMigrationSafetyApprovals = []string{
	"-- safety: destructive-change-approved",
	"-- safety: data-backup-required",
	"-- safety: rollback-reviewed",
}

type migrationSafetyResult struct {
	FileName string
	Safe     bool
	Reasons  []string
}

func scanMigrationSafety(migrationsDir string) ([]migrationSafetyResult, error) {
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return nil, fmt.Errorf("read migrations directory: %w", err)
	}

	results := make([]migrationSafetyResult, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".sql" {
			continue
		}

		path := filepath.Join(migrationsDir, entry.Name())
		contents, err := os.ReadFile(path)
		if err != nil {
			return nil, fmt.Errorf("read migration %s: %w", entry.Name(), err)
		}

		results = append(results, assessMigrationSafety(entry.Name(), string(contents)))
	}

	sort.Slice(results, func(i, j int) bool {
		return results[i].FileName < results[j].FileName
	})

	return results, nil
}

func assessMigrationSafety(fileName, contents string) migrationSafetyResult {
	result := migrationSafetyResult{
		FileName: fileName,
		Safe:     true,
	}

	version, ok := migrationVersion(fileName)
	if !ok || version <= migrationSafetyBaselineVersion {
		return result
	}

	for _, destructivePattern := range destructiveMigrationPatterns {
		if destructivePattern.pattern.MatchString(contents) {
			result.Reasons = append(result.Reasons, destructivePattern.name)
		}
	}

	if len(result.Reasons) == 0 {
		return result
	}

	if !hasSafetyApprovalBlock(contents) {
		result.Safe = false
		result.Reasons = append(result.Reasons, "missing safety approval block")
	}

	return result
}

func migrationVersion(fileName string) (int, bool) {
	versionText, _, found := strings.Cut(fileName, "_")
	if !found {
		return 0, false
	}

	var version int
	if _, err := fmt.Sscanf(versionText, "%d", &version); err != nil {
		return 0, false
	}
	return version, true
}

func hasSafetyApprovalBlock(contents string) bool {
	normalized := strings.ToLower(contents)
	for _, requiredApproval := range requiredMigrationSafetyApprovals {
		if !strings.Contains(normalized, requiredApproval) {
			return false
		}
	}
	return true
}
