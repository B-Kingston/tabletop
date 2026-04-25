package websocket

import (
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"tabletop/backend/internal/middleware"
)

func ServeWS(hub *Hub, db *gorm.DB) gin.HandlerFunc {
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

		upgrader.CheckOrigin = func(r *http.Request) bool { return true }
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
