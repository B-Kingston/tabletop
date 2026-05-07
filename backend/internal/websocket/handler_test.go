package websocket

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestCheckOriginAllowsAnyConfiguredOrigin(t *testing.T) {
	checkOrigin := CheckOrigin([]string{"https://app.example.com", "http://192.168.1.5:3000"})

	req, err := http.NewRequest(http.MethodGet, "/ws", nil)
	require.NoError(t, err)
	req.Header.Set("Origin", "http://192.168.1.5:3000")

	require.True(t, checkOrigin(req))
}

func TestCheckOriginRejectsUnconfiguredOrigin(t *testing.T) {
	checkOrigin := CheckOrigin([]string{"https://app.example.com", "http://192.168.1.5:3000"})

	req, err := http.NewRequest(http.MethodGet, "/ws", nil)
	require.NoError(t, err)
	req.Header.Set("Origin", "https://evil.example")

	require.False(t, checkOrigin(req))
}
