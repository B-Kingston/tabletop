# Member Messages and AI Assistant Design

## Goal

Separate human instance chat from OpenAI chat so users can message other members without triggering OpenAI quota errors, while preserving the existing AI assistant workflow as a clearly labeled feature.

## Product Shape

Instance navigation will expose two entries:

- `Messages`: a shared persisted group chat for members of the current instance.
- `AI Assistant`: the existing session-based OpenAI chat, renamed in the UI so errors and expectations are scoped to AI.

The existing AI chat endpoints remain available at `/instances/:instance_id/chat/...` for compatibility. The frontend route for the old AI page moves from `/chat` to `/ai`, with `/chat` becoming the member chat page.

## Backend Design

Add a `member_messages` table with `id`, `instance_id`, `user_id`, `content`, and `created_at`. Each row belongs to one instance and one user. Queries are scoped by `instance_id`, and sender data is preloaded for display.

Add a member message repository and service with:

- `ListMessages(ctx, instanceID)` returning messages in chronological order.
- `SendMessage(ctx, instanceID, userID, content)` trimming content, rejecting empty messages, persisting the message, and returning it with user data.

Add `/instances/:instance_id/messages`:

- `GET` returns persisted message history.
- `POST` creates a message and broadcasts a websocket event of type `member_message.created` to the existing instance room after persistence succeeds.

## Frontend Design

Add `MemberMessagesPage` at `/instances/$instanceId/chat`. It uses TanStack Query for history and a mutation for sending messages. It opens the existing websocket endpoint for realtime updates and appends incoming `member_message.created` events for the active instance.

Rename the current `ChatPage` component to `AIAssistantPage` behaviorally by changing headings, empty states, labels, and navigation text. The current AI session UI remains session-based and backed by the existing `useChat` hooks.

## Error Handling

Member chat errors show normal API failure states and do not mention AI. AI chat mutation errors show a clear message when OpenAI quota is exhausted, so the user understands that member messaging is unaffected.

## Testing

Backend tests cover repository ordering/scoping, service validation/persistence, and handler broadcast behavior. Frontend tests cover navigation labels, member message rendering/sending, and AI page copy that distinguishes it from member chat.
