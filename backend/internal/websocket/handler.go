package websocket

import (
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"tabletop/backend/internal/middleware"
)

func CheckOrigin(allowedOrigins []string) func(*http.Request) bool {
	return func(r *http.Request) bool {
		return middleware.IsOriginAllowed(r.Header.Get("Origin"), allowedOrigins)
	}
}

func ServeWS(hub *Hub, db *gorm.DB, allowedOrigins []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		instanceID, ok := middleware.GetInstanceID(c)
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid instance"})
			return
		}
		userID, ok := middleware.GetInternalUserID(c)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		upgrader.CheckOrigin = CheckOrigin(allowedOrigins)
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			slog.Error("websocket upgrade failed", "error", err)
			return
		}

		client := NewClient(hub, conn, instanceID, userID)
		hub.register <- &clientEvent{client: client, instanceID: instanceID}

		go client.WritePump()
		go client.ReadPump()
	}
}
