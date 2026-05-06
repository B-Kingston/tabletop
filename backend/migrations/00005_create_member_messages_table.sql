-- +goose Up
CREATE TABLE member_messages (
    id UUID PRIMARY KEY,
    instance_id UUID NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_member_messages_instance_id ON member_messages(instance_id);
CREATE INDEX idx_member_messages_user_id ON member_messages(user_id);
CREATE INDEX idx_member_messages_instance_created_at ON member_messages(instance_id, created_at);

-- +goose Down
DROP TABLE IF EXISTS member_messages CASCADE;
