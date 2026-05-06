package websocket

import (
	"errors"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/require"
)

func TestReadPumpIgnoresClientOriginatedMessages(t *testing.T) {
	hub := NewHub()
	go hub.Run()

	instanceID := uuid.New()
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Skipf("skipping websocket integration test because local listening is unavailable: %v", err)
	}

	server := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		require.NoError(t, err)

		client := NewClient(hub, conn, instanceID, uuid.New())
		hub.register <- &clientEvent{client: client, instanceID: instanceID}

		go client.WritePump()
		go client.ReadPump()
	}))
	server.Listener = listener
	server.Start()
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	receiver, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	require.NoError(t, err)
	defer receiver.Close()

	sender, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	require.NoError(t, err)
	defer sender.Close()

	require.Eventually(t, func() bool {
		hub.mu.RLock()
		defer hub.mu.RUnlock()
		return len(hub.rooms[instanceID]) == 2
	}, time.Second, 10*time.Millisecond)

	forgedEvent := []byte(`{"type":"member_message.created","data":{"content":"forged"}}`)
	require.NoError(t, sender.WriteMessage(websocket.TextMessage, forgedEvent))

	receiver.SetReadDeadline(time.Now().Add(150 * time.Millisecond))
	_, message, err := receiver.ReadMessage()
	if err == nil {
		t.Fatalf("received client-originated message that should have been ignored: %s", string(message))
	}

	var netErr net.Error
	require.True(t, errors.As(err, &netErr) && netErr.Timeout(), "expected read timeout, got %v", err)
}
