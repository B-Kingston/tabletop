package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

type JSONBlob []byte

func (j JSONBlob) Value() (driver.Value, error) {
	if len(j) == 0 {
		return "{}", nil
	}
	return string(j), nil
}

func (j *JSONBlob) Scan(value any) error {
	switch v := value.(type) {
	case nil:
		*j = JSONBlob("{}")
	case []byte:
		*j = append((*j)[:0], v...)
	case string:
		*j = append((*j)[:0], v...)
	default:
		return fmt.Errorf("unsupported JSONBlob scan type %T", value)
	}
	return nil
}

func (j JSONBlob) MarshalJSON() ([]byte, error) {
	if len(j) == 0 {
		return []byte("{}"), nil
	}
	return j, nil
}

type StringList []string

func (s StringList) Value() (driver.Value, error) {
	if s == nil {
		return "[]", nil
	}
	bytes, err := json.Marshal([]string(s))
	if err != nil {
		return nil, err
	}
	return string(bytes), nil
}

func (s *StringList) Scan(value any) error {
	switch v := value.(type) {
	case nil:
		*s = StringList{}
	case []byte:
		return json.Unmarshal(v, s)
	case string:
		return json.Unmarshal([]byte(v), s)
	default:
		return fmt.Errorf("unsupported StringList scan type %T", value)
	}
	return nil
}
