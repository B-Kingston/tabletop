-- +goose Up
-- Add ON DELETE CASCADE to chat_messages.session_id FK so deleting a session cleans up its messages

ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_session_id_fkey;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE;

-- +goose Down
-- Restore bare foreign key reference (no CASCADE)

ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_session_id_fkey;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES chat_sessions(id);
