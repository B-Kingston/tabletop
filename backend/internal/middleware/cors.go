package middleware

import (
	"github.com/gin-gonic/gin"
)

// CORSConfig holds CORS configuration
type CORSConfig struct {
	AllowOrigins []string
}

// CORS returns a middleware that handles cross-origin requests
func CORS(cfg *CORSConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		allowed := false
		wildcard := false
		for _, o := range cfg.AllowOrigins {
			if o == "*" {
				wildcard = true
				break
			}
			if o == origin {
				allowed = true
				break
			}
		}

		if wildcard {
			// Mirror the request origin so credentials work (browser
			// rejects Access-Control-Allow-Origin: * when credentials=true)
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else if allowed {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
