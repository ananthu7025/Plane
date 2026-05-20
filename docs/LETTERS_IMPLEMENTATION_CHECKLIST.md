# Letters Feature - Implementation Checklist

**Status**: Ready to Begin Implementation
**Last Updated**: May 20, 2026
**Total Tasks**: 80+
**Estimated Duration**: 2-3 weeks

---

## Phase 1: Database Setup (1-2 Days)

### Database Schema
- [ ] Read LETTERS_DATABASE_SCHEMA.md
- [ ] Add pgEnum for letter status
- [ ] Create `letters` table in schema.ts
- [ ] Create `letterVersions` table in schema.ts
- [ ] Create `letterLikes` table in schema.ts
- [ ] Create `letterViews` table in schema.ts
- [ ] Add all relations (lettersRelations, letterVersionsRelations, etc.)
- [ ] Verify Drizzle types compile
- [ ] Create migration file (SQL)
- [ ] Test migration runs without errors
- [ ] Verify tables created in database
- [ ] Verify indexes created

**Verification**:
- [ ] `drizzle-kit generate` works
- [ ] `npm run db:migrate` succeeds
- [ ] Tables visible in database GUI
- [ ] Relations correctly defined

---

## Phase 2: Backend Services (2-3 Days)

### Service Layer (letterService.ts)

**Post Creation & Retrieval**:
- [ ] Create createLetter() service method
  - [ ] Validate subject & content
  - [ ] Check user not banned (if applicable)
  - [ ] Create letter record
  - [ ] Create first version
  - [ ] Return created letter with status pending
- [ ] Create submitVersion() service method
  - [ ] Find original letter
  - [ ] Verify belongs to current user
  - [ ] Verify status is rejected
  - [ ] Create new version with next version number
  - [ ] Update parent letter version counts
  - [ ] Return new version
- [ ] Create getLetter() service method
  - [ ] Get letter with full content
  - [ ] Get author info (real name even if anonymous)
  - [ ] Include view/like counts
  - [ ] Increment view count
  - [ ] Return formatted response
- [ ] Create getPublicLetters() service method
  - [ ] Query approved letters only
  - [ ] Apply pagination
  - [ ] Apply search filters (subject, content)
  - [ ] Apply sort (recent/views/likes)
  - [ ] Hide author if anonymous
  - [ ] Include snippet (first 150 chars)
  - [ ] Return with pagination

**Like & View Handling**:
- [ ] Create toggleLike() service method
  - [ ] Check if already liked
  - [ ] Delete if exists, insert if not
  - [ ] Update like count
  - [ ] Prevent self-likes
  - [ ] Return new count
- [ ] Create getLetterStats() service method
  - [ ] Count total letters
  - [ ] Count by status (pending/approved/rejected)
  - [ ] Sum total views
  - [ ] Sum total likes
  - [ ] Return stats object

**User-Specific Queries**:
- [ ] Create getMyLetters() service method
  - [ ] Get all letters for current user
  - [ ] Filter by status if provided
  - [ ] Include rejection reasons
  - [ ] Apply pagination
  - [ ] Show versions if requested
  - [ ] Return with status badges
- [ ] Create getVersions() service method
  - [ ] Get all versions of letter
  - [ ] Show rejection info
  - [ ] Show approval info
  - [ ] Order by version number
  - [ ] Include admin names

**Admin Moderation**:
- [ ] Create getModerationQueue() service method
  - [ ] Get letters for moderation
  - [ ] Filter by status (all/pending/approved/rejected)
  - [ ] Apply search (subject/author)
  - [ ] Pagination support
  - [ ] Always show real author (even if anon)
  - [ ] Include version history
  - [ ] Sort by submitted date
- [ ] Create approveLetter() service method
  - [ ] Find letter & current version
  - [ ] Change status to approved
  - [ ] Record which admin approved
  - [ ] Set approvedAt timestamp
  - [ ] Return updated letter
- [ ] Create rejectLetter() service method
  - [ ] Find letter & current version
  - [ ] Change status to rejected
  - [ ] Store rejection reason
  - [ ] Record which admin rejected
  - [ ] Set rejectedAt timestamp
  - [ ] Return updated letter
- [ ] Create deleteLetter() service method
  - [ ] Soft delete letter
  - [ ] Set deletedAt timestamp
  - [ ] Set is_deleted flag
  - [ ] Return success

**Service Testing**:
- [ ] Test createLetter with valid data
- [ ] Test createLetter with invalid data
- [ ] Test submitVersion resubmission flow
- [ ] Test getLetter view count increment
- [ ] Test toggleLike (on/off)
- [ ] Test prevent self-likes
- [ ] Test getPublicLetters pagination
- [ ] Test search functionality
- [ ] Test status filtering
- [ ] Test anonymous handling
- [ ] Test getMyLetters with status filter
- [ ] Test admin queries
- [ ] Test approval flow
- [ ] Test rejection flow

---

## Phase 3: Backend Routes (1-2 Days)

### Student Routes

- [ ] POST /api/letters - Create letter
  - [ ] Check authentication
  - [ ] Validate request body
  - [ ] Call createLetter service
  - [ ] Return 201 with created letter
  - [ ] Handle validation errors (400)
  - [ ] Handle unauthorized (401)
  - [ ] Handle server errors (500)

- [ ] POST /api/letters/:id/versions - Resubmit
  - [ ] Check authentication
  - [ ] Check letter belongs to user
  - [ ] Check previous status is rejected
  - [ ] Validate request body
  - [ ] Call submitVersion service
  - [ ] Return 201 with new version
  - [ ] Handle validation errors
  - [ ] Handle not found (404)
  - [ ] Handle forbidden (403)

- [ ] GET /api/letters/public - Public feed
  - [ ] No auth required
  - [ ] Parse pagination params
  - [ ] Call getPublicLetters service
  - [ ] Return 200 with letters + pagination
  - [ ] Support search, sort, filters
  - [ ] Handle page out of range

- [ ] GET /api/letters/:id - Letter detail
  - [ ] No auth required
  - [ ] Call getLetter service
  - [ ] Increment view count
  - [ ] Return 200 with full letter
  - [ ] Handle not found (404)
  - [ ] Handle not approved (403)

- [ ] PUT /api/letters/:id/acknowledge - Like/unlike
  - [ ] Check authentication
  - [ ] Call toggleLike service
  - [ ] Return 200 with updated counts
  - [ ] Handle not found (404)
  - [ ] Handle self-like attempt (400)

- [ ] GET /api/letters/my-letters - My submissions
  - [ ] Check authentication
  - [ ] Parse query params (status, page)
  - [ ] Call getMyLetters service
  - [ ] Return 200 with letters + pagination
  - [ ] Include rejection reasons
  - [ ] Include version history if requested

- [ ] GET /api/letters/:id/versions - Letter versions
  - [ ] Check authentication
  - [ ] Check belongs to user OR user is admin
  - [ ] Call getVersions service
  - [ ] Return 200 with all versions
  - [ ] Show rejection/approval info
  - [ ] Handle not found (404)

### Admin Routes

- [ ] GET /api/letters/admin/moderation - Moderation queue
  - [ ] Check admin role
  - [ ] Parse query params (status, search, page)
  - [ ] Call getModerationQueue service
  - [ ] Always show real author
  - [ ] Return 200 with letters
  - [ ] Include stats in response
  - [ ] Handle not admin (403)

- [ ] PUT /api/letters/:id/approve - Approve letter
  - [ ] Check admin role
  - [ ] Call approveLetter service
  - [ ] Return 200 with updated letter
  - [ ] Handle not found (404)
  - [ ] Handle already approved (409)
  - [ ] Handle not admin (403)

- [ ] PUT /api/letters/:id/reject - Reject letter
  - [ ] Check admin role
  - [ ] Validate rejection reason
  - [ ] Call rejectLetter service
  - [ ] Return 200 with updated letter
  - [ ] Handle not found (404)
  - [ ] Handle already rejected (409)
  - [ ] Handle not admin (403)

- [ ] DELETE /api/letters/:id - Delete letter
  - [ ] Check admin role
  - [ ] Call deleteLetter service
  - [ ] Return 200 with success message
  - [ ] Handle not found (404)
  - [ ] Handle not admin (403)

- [ ] GET /api/letters/admin/stats - Dashboard stats
  - [ ] Check admin role
  - [ ] Call getLetterStats service
  - [ ] Return 200 with all stats
  - [ ] Include pending count
  - [ ] Include recent activity timestamps
  - [ ] Handle not admin (403)

### Route Testing

- [ ] Test all student routes (auth + no auth)
- [ ] Test all admin routes (admin only + non-admin)
- [ ] Test 400 validation errors
- [ ] Test 401 unauthorized
- [ ] Test 403 forbidden
- [ ] Test 404 not found
- [ ] Test 409 conflict (already approved)
- [ ] Test 500 server errors
- [ ] Test rate limiting (if implemented)
- [ ] Verify response format consistency
- [ ] Verify error messages helpful

---

## Phase 4: Redux Setup (1 Day)

### Redux Slice (letterSlice.ts)

- [ ] Create initial state object
- [ ] Create synchronous reducers:
  - [ ] setPublicSearch()
  - [ ] setPublicSort()
  - [ ] setPublicPage()
  - [ ] setMyLettersStatus()
  - [ ] setMyLettersPage()
  - [ ] setModerationStatus()
  - [ ] setModerationSearch()
  - [ ] setModerationPage()
  - [ ] setSelectedLetter()
  - [ ] clearSelectedLetter()
  - [ ] clearError()
  - [ ] clearSuccessMessage()
- [ ] Create async reducers for each thunk
  - [ ] Handle pending state
  - [ ] Handle fulfilled state
  - [ ] Handle rejected state
- [ ] Test Redux DevTools integration
- [ ] Verify state shape correct
- [ ] Verify types defined

### Async Thunks (letterThunks.ts)

- [ ] Create fetchPublicLetters thunk
  - [ ] Accept params (page, limit, sort, search)
  - [ ] Call GET /api/letters/public
  - [ ] Return letters + pagination
  - [ ] Handle error with rejectWithValue
- [ ] Create fetchMyLetters thunk
  - [ ] Accept params (page, status)
  - [ ] Call GET /api/letters/my-letters
  - [ ] Return letters + pagination
  - [ ] Handle error
- [ ] Create createLetter thunk
  - [ ] Accept form data
  - [ ] Call POST /api/letters
  - [ ] Return created letter
  - [ ] Handle validation errors
- [ ] Create fetchModerationQueue thunk
  - [ ] Accept params (status, search, page)
  - [ ] Call GET /api/letters/admin/moderation
  - [ ] Return letters + stats
  - [ ] Handle error
- [ ] Create approveLetter thunk
  - [ ] Accept letterId
  - [ ] Call PUT /api/letters/:id/approve
  - [ ] Return updated letter
  - [ ] Handle error
- [ ] Create rejectLetter thunk
  - [ ] Accept letterId + rejectionReason
  - [ ] Call PUT /api/letters/:id/reject
  - [ ] Return updated letter
  - [ ] Handle error
- [ ] Create toggleLike thunk
  - [ ] Accept letterId
  - [ ] Call PUT /api/letters/:id/acknowledge
  - [ ] Return updated counts
  - [ ] Handle error
- [ ] Create submitVersion thunk
  - [ ] Accept letterId + form data
  - [ ] Call POST /api/letters/:id/versions
  - [ ] Return new version
  - [ ] Handle error

### Redux Integration Tests

- [ ] Register letterReducer in store
- [ ] Verify Redux DevTools shows state
- [ ] Dispatch thunks and verify state updates
- [ ] Test pending/fulfilled/rejected states
- [ ] Test error handling
- [ ] Verify no TypeScript errors

---

## Phase 5: Frontend - Student Pages (2 Days)

### StudentLetters.tsx Integration

- [ ] Copy from UI folder
- [ ] Import Redux hooks
  - [ ] useAppDispatch
  - [ ] useAppSelector
- [ ] Wire up initial data fetch
  - [ ] useEffect on mount
  - [ ] Dispatch fetchPublicLetters
  - [ ] Dispatch fetchMyLetters (my letters tab)
- [ ] Public Letters Tab
  - [ ] Show letters from Redux state
  - [ ] Implement infinite scroll
  - [ ] Load next page on scroll
  - [ ] Show loading state while loading
  - [ ] Hide author name if isAnonymous
  - [ ] Show letter card with snippet
  - [ ] Like button toggles like
  - [ ] Click letter opens detail dialog
- [ ] My Letters Tab
  - [ ] Show user's letters only
  - [ ] Filter by status (pending/approved/rejected)
  - [ ] Show status badge
  - [ ] Show rejection reason if rejected
  - [ ] Edit button for rejected letters
  - [ ] Show metrics for approved (views/likes)
  - [ ] Archive/unarchive functionality
- [ ] Compose Letter Modal
  - [ ] Subject field (5-200 chars)
  - [ ] Content field (10-5000 chars)
  - [ ] Courier font applied
  - [ ] Anonymous toggle
  - [ ] Cover image upload (optional)
  - [ ] Form validation
  - [ ] Submit calls createLetter thunk
  - [ ] Show loading while submitting
  - [ ] Success toast on submit
  - [ ] Error toast on failure
  - [ ] Close modal on success
- [ ] Letter Detail Dialog
  - [ ] Show full letter
  - [ ] Show cover image
  - [ ] Show author name
  - [ ] Show timestamp
  - [ ] Show view count
  - [ ] Acknowledge button (like)
  - [ ] Update count on like
  - [ ] Close button
  - [ ] Restore scroll position on close
- [ ] Stats Dashboard
  - [ ] Published letters count
  - [ ] Total acknowledgements count
  - [ ] Total views count
- [ ] Error Handling
  - [ ] Show error toast
  - [ ] Disable buttons on error
  - [ ] Retry functionality
- [ ] Loading States
  - [ ] Skeleton screens
  - [ ] Spinners on buttons
  - [ ] Loading text
- [ ] State Persistence
  - [ ] Save scroll position to sessionStorage
  - [ ] Restore on dialog close
  - [ ] Save active tab
  - [ ] Save filters/search

### StudentLetters Testing

- [ ] Navigate to page
- [ ] Public letters load
- [ ] Infinite scroll loads more
- [ ] Can write letter
- [ ] Letter appears in my letters as pending
- [ ] Can like letter
- [ ] Detail dialog opens and closes
- [ ] Scroll position restored
- [ ] My letters tab shows correct status
- [ ] Rejected letter shows reason
- [ ] Can resubmit rejected letter
- [ ] Error handling works
- [ ] Loading states show
- [ ] Mobile responsive

---

## Phase 6: Frontend - Admin Pages (2 Days)

### AdminLetters.tsx Integration

- [ ] Copy from UI folder
- [ ] Import Redux hooks
- [ ] Wire up initial data fetch
  - [ ] useEffect on mount
  - [ ] Dispatch fetchModerationQueue
  - [ ] Dispatch getLetterStats
- [ ] Dashboard Stats
  - [ ] Total letters count
  - [ ] Pending review count
  - [ ] Published count
  - [ ] Total views count
  - [ ] Total acknowledgements count
- [ ] Moderation Queue
  - [ ] Status tabs (All, Pending, Approved, Rejected)
  - [ ] Search bar (subject/author)
  - [ ] Letter list from Redux
  - [ ] Show real author even if anonymous
  - [ ] Anonymous badge with tooltip
  - [ ] Quick approve button
  - [ ] Quick reject button
  - [ ] More menu with options
- [ ] Approval Workflow
  - [ ] Click approve
  - [ ] Letter status changes to approved
  - [ ] Moves to approved tab
  - [ ] Success toast
  - [ ] Refresh stats
- [ ] Rejection Workflow
  - [ ] Click reject
  - [ ] Modal opens for reason
  - [ ] User enters rejection reason
  - [ ] Click confirm
  - [ ] Dispatch rejectLetter thunk
  - [ ] Letter status changes to rejected
  - [ ] Show rejection reason in detail
  - [ ] Success toast
  - [ ] Refresh queue
- [ ] Letter Detail Dialog
  - [ ] View full letter button
  - [ ] Opens dialog with full content
  - [ ] Shows real author
  - [ ] Shows version history
  - [ ] Approve & Publish button
  - [ ] Reject button (if pending)
  - [ ] Delete button (more menu)
  - [ ] Close button
- [ ] Version History
  - [ ] Show v1, v2, v3 versions
  - [ ] Show status of each version
  - [ ] Show rejection reasons
  - [ ] Show dates/times
  - [ ] Show admin names
- [ ] Anonymous Tooltip
  - [ ] Hover over Anonymous badge
  - [ ] Shows real name
  - [ ] Shows email address
- [ ] Error Handling
  - [ ] Error toast on failure
  - [ ] Disable buttons on error
  - [ ] Retry functionality
- [ ] Loading States
  - [ ] Initial load spinner
  - [ ] Button spinners during action
  - [ ] Skeleton screens

### AdminLetters Testing

- [ ] Navigate to admin letters
- [ ] Dashboard stats display
- [ ] Moderation queue loads
- [ ] Status tabs filter correctly
- [ ] Search works (by subject/author)
- [ ] Approve button works
- [ ] Reject button opens modal
- [ ] Can enter rejection reason
- [ ] Letter status updates
- [ ] View full letter dialog opens
- [ ] Anonymous tooltip shows real name
- [ ] Delete button works
- [ ] Version history displays
- [ ] Error handling works
- [ ] Mobile responsive

---

## Phase 7: Feature Components (1 Day)

### Extract Reusable Components

- [ ] ComposeLetterModal.tsx
  - [ ] Form with validation
  - [ ] Subject input
  - [ ] Content textarea
  - [ ] Courier font
  - [ ] Cover image upload
  - [ ] Anonymous toggle
  - [ ] Submit/cancel buttons
  - [ ] Loading state

- [ ] LetterCard.tsx
  - [ ] Author info
  - [ ] Cover image
  - [ ] Subject
  - [ ] Content snippet
  - [ ] Metadata (date, time)
  - [ ] View count
  - [ ] Like button
  - [ ] Click handler
  - [ ] Anonymous indicator

- [ ] LetterDetailDialog.tsx
  - [ ] Full letter content
  - [ ] Cover image
  - [ ] Author metadata
  - [ ] Timestamp
  - [ ] View/like counts
  - [ ] Acknowledge button
  - [ ] Close button
  - [ ] Typewriter styling

- [ ] ModerationActions.tsx
  - [ ] Approve button
  - [ ] Reject button (opens modal)
  - [ ] Delete button
  - [ ] More menu
  - [ ] Version history link
  - [ ] Anonymous reveal tooltip
  - [ ] Loading states

### Component Testing

- [ ] Components render without errors
- [ ] Props validation works
- [ ] Event handlers called
- [ ] Styling applied correctly
- [ ] Loading states display
- [ ] Error states display
- [ ] Mobile responsive

---

## Phase 8: State Persistence (1 Day)

### Scroll Position Persistence

- [ ] Create useScrollPersistence hook
- [ ] Save scroll position on dialog open
- [ ] Restore scroll position on dialog close
- [ ] Use sessionStorage (clears on browser close)
- [ ] Test with multiple page visits
- [ ] Test with tab switching

### Filter/Search Persistence

- [ ] Save active tab to sessionStorage
- [ ] Save search query to sessionStorage
- [ ] Save status filter to sessionStorage
- [ ] Save sort order to sessionStorage
- [ ] Restore on page reload
- [ ] Restore on back navigation

### Pagination Persistence

- [ ] Save current page to state
- [ ] Save pagination cursor (if using)
- [ ] Save limit to state
- [ ] Maintain on filter change
- [ ] Reset to page 1 when search changes

---

## Phase 9: Testing & Polish (2 Days)

### End-to-End Testing

- [ ] Complete student journey
  - [ ] Create letter
  - [ ] Submit for review
  - [ ] Letter in My Letters as pending
  - [ ] View public letters
  - [ ] Like a letter
  - [ ] Open detail
  - [ ] Close and verify scroll
  - [ ] Infinite scroll loads more
  - [ ] Receive rejection feedback
  - [ ] Resubmit as v2

- [ ] Complete admin journey
  - [ ] View moderation queue
  - [ ] Search for letter
  - [ ] Filter by status
  - [ ] Approve letter
  - [ ] View published letter
  - [ ] Reject with reason
  - [ ] View rejection reason
  - [ ] Delete letter
  - [ ] View version history

### UI/UX Polish

- [ ] Verify Courier font in letters
- [ ] Verify paper plane icon displays
- [ ] Verify typewriter styling
- [ ] Verify dark mode works
- [ ] Verify light mode works
- [ ] Check animations smooth
- [ ] Check transitions work
- [ ] Verify spacing/padding
- [ ] Check colors match design
- [ ] Verify hover states

### Performance

- [ ] Check page load time
- [ ] Check infinite scroll performance
- [ ] Check Redux state size
- [ ] Check component re-renders
- [ ] Optimize if needed
- [ ] Check mobile performance
- [ ] Check network requests

### Browser Testing

- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on Edge
- [ ] Test on mobile Safari
- [ ] Test on Chrome mobile
- [ ] Test on different screen sizes

### Error Scenarios

- [ ] Network error handling
- [ ] Invalid form submission
- [ ] 404 letter not found
- [ ] 403 forbidden access
- [ ] 401 unauthorized
- [ ] 500 server error
- [ ] Rate limit exceeded
- [ ] Empty states
- [ ] No search results

---

## Phase 10: Documentation (1 Day)

### Code Documentation

- [ ] Add JSDoc comments to services
- [ ] Add JSDoc comments to thunks
- [ ] Add JSDoc comments to components
- [ ] Document Redux state shape
- [ ] Document API request/response

### User Documentation

- [ ] Write user guide for students
- [ ] Write admin guide for moderation
- [ ] Create FAQ
- [ ] Document keyboard shortcuts (if any)
- [ ] Create troubleshooting guide

---

## Phase 11: Deployment (1 Day)

### Pre-Deployment Checks

- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] Performance acceptable
- [ ] Security review complete
- [ ] Code review approved
- [ ] Database migrations tested
- [ ] Environment variables set
- [ ] API endpoints verified
- [ ] Rate limiting working
- [ ] Error logging working

### Staging Deployment

- [ ] Deploy to staging
- [ ] Smoke test all features
- [ ] User acceptance testing
- [ ] Performance monitoring
- [ ] Load testing
- [ ] Security testing

### Production Deployment

- [ ] Create deployment checklist
- [ ] Backup database
- [ ] Deploy code
- [ ] Run migrations
- [ ] Verify features work
- [ ] Monitor logs
- [ ] Monitor performance
- [ ] Monitor errors

---

## Sign-Off Checklist

### Before Launch

- [ ] All 80+ tasks completed
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Documentation complete
- [ ] User training complete
- [ ] Support team trained
- [ ] Monitoring setup
- [ ] Rollback plan ready

### Launch Day

- [ ] Deploy to production
- [ ] Verify all features
- [ ] Monitor closely
- [ ] Be available for support
- [ ] Document any issues
- [ ] Celebrate! 🎉

---

## Notes

- **Total Tasks**: 80+
- **Estimated Duration**: 2-3 weeks
- **Team Size**: 1-2 developers
- **Total Effort**: ~150 hours

### Helpful Tips

1. Use Redux DevTools to debug state
2. Test one endpoint at a time
3. Test student flow before admin flow
4. Save screenshots for QA testing
5. Keep error messages user-friendly
6. Use toast notifications for feedback
7. Test on mobile early and often
8. Check Courier font on all browsers
9. Use sessionStorage for scroll position
10. Keep migrations clean and reversible

### Common Pitfalls to Avoid

❌ Not validating on backend
❌ Forgetting soft deletes
❌ Not preventing self-likes
❌ Not showing loading states
❌ Losing scroll position
❌ Not handling errors gracefully
❌ Not testing edge cases
❌ Not testing on mobile
❌ Not testing with slow network
❌ Not documenting decisions

---

**Happy Coding! 🚀**

Print this checklist and check off items as you complete them. This ensures nothing is missed!
