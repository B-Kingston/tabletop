# Member Messages and AI Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build persisted realtime instance member messaging and make the existing OpenAI chat clearly separate as AI Assistant.

**Architecture:** Add a backend member message model/repository/service/handler backed by a Goose migration and the existing instance websocket hub. Add a frontend member messages route at `/chat`, move the existing AI sessions UI to `/ai`, and keep existing AI APIs compatible.

**Tech Stack:** Go, Gin, GORM, Goose, PostgreSQL, React, TypeScript, TanStack Query, TanStack Router, Vitest, React Testing Library.

---

## File Structure

- Create `backend/internal/models/member_message.go` for persisted human instance messages.
- Create `backend/internal/repositories/member_message.go` and tests for scoped message data access.
- Create `backend/internal/services/member_message.go` and tests for validation and message creation.
- Create `backend/internal/handlers/messages/messages.go` and tests for list/send plus websocket broadcast.
- Modify `backend/cmd/api/main.go` to wire the new domain.
- Create `backend/migrations/00005_create_member_messages_table.sql`.
- Modify `frontend/src/types/models.ts` to add `MemberMessage`.
- Create `frontend/src/hooks/useMemberMessages.ts` and tests for list/send APIs.
- Create `frontend/src/pages/MemberMessagesPage.tsx` and tests for history, send, and realtime append.
- Modify `frontend/src/pages/ChatPage.tsx` copy to become the AI Assistant experience.
- Modify `frontend/src/router.tsx` and `frontend/src/components/layout/InstanceNav.tsx` to route `Messages` and `AI Assistant`.
- Modify `frontend/src/__tests__/handlers.ts` to mock member message endpoints.

## Tasks

- [ ] Add failing backend tests for member message repository scoping and ordering.
- [ ] Implement `MemberMessage` model and repository until those tests pass.
- [ ] Add failing backend service tests for trim, empty rejection, and persisted sender data.
- [ ] Implement member message service until those tests pass.
- [ ] Add failing handler tests for `GET /messages`, `POST /messages`, and websocket broadcast event shape.
- [ ] Implement messages handler and main wiring until those tests pass.
- [ ] Add Goose migration and keep model/migration schema in sync.
- [ ] Add failing frontend tests for navigation split, member message page, and AI Assistant copy.
- [ ] Implement frontend route/nav/page/hooks changes until tests pass.
- [ ] Run backend tests, frontend tests, and frontend production build.
- [ ] Evaluate backend build requirement and run the backend build command that is safe locally.
