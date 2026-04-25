package websocket

import (
	"sync"

	"github.com/google/uuid"
)

type Hub struct {
	mu         sync.RWMutex
	rooms      map[uuid.UUID]map[*Client]struct{}
	register   chan *clientEvent
	unregister chan *clientEvent
	broadcast  chan *broadcastEvent
}

type clientEvent struct {
	client     *Client
	instanceID uuid.UUID
}

type broadcastEvent struct {
	instanceID uuid.UUID
	message    []byte
}

func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[uuid.UUID]map[*Client]struct{}),
		register:   make(chan *clientEvent),
		unregister: make(chan *clientEvent),
		broadcast:  make(chan *broadcastEvent, 256),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case evt := <-h.register:
			h.mu.Lock()
			if h.rooms[evt.instanceID] == nil {
				h.rooms[evt.instanceID] = make(map[*Client]struct{})
			}
			h.rooms[evt.instanceID][evt.client] = struct{}{}
			h.mu.Unlock()
		case evt := <-h.unregister:
			h.mu.Lock()
			if room, ok := h.rooms[evt.instanceID]; ok {
				delete(room, evt.client)
				if len(room) == 0 {
					delete(h.rooms, evt.instanceID)
				}
			}
			h.mu.Unlock()
			close(evt.client.send)
		case evt := <-h.broadcast:
			h.mu.RLock()
			room := h.rooms[evt.instanceID]
			h.mu.RUnlock()
			for client := range room {
				select {
				case client.send <- evt.message:
				default:
					h.mu.Lock()
					delete(h.rooms[evt.instanceID], client)
					if len(h.rooms[evt.instanceID]) == 0 {
						delete(h.rooms, evt.instanceID)
					}
					h.mu.Unlock()
					close(client.send)
				}
			}
		}
	}
}

func (h *Hub) Broadcast(instanceID uuid.UUID, message []byte) {
	h.broadcast <- &broadcastEvent{instanceID: instanceID, message: message}
}
