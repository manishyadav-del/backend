# Visual Page Builder

A comprehensive visual page builder that allows administrators to create and manage page layouts and content without writing code.

## Features

### 1. Visual Page Editor
- **Three-panel layout**: Section list (left), Live preview (center), Properties panel (right)
- **Drag-and-drop reordering**: Easily rearrange sections by dragging
- **Real-time preview**: See changes instantly as you edit
- **Inline editing**: Click on text directly in the preview to edit

### 2. Section Management
- **12 pre-built section types**:
  - Hero - Full-width hero banner with heading, text, and CTA
  - About - About us section with text and image
  - Services - Showcase services in a grid layout
  - Features - Highlight key features and benefits
  - CTA - Call to action section
  - Testimonials - Display client testimonials
  - FAQ - Frequently asked questions accordion
  - Gallery - Image gallery grid
  - Contact - Contact information and form
  - Statistics - Display key metrics and numbers
  - Team - Showcase team members
  - Custom HTML - Add custom HTML code

- **Section operations**:
  - Add sections from template library
  - Delete sections with confirmation
  - Hide/show sections (hidden sections remain in config but not rendered)
  - Reorder via drag-and-drop
  - Visual indicators for hidden sections

### 3. Content Editing
- **Inline editing** for headings, subheadings, descriptions
- **Rich text support** via contentEditable
- **Button text and URL editing**
- **Image alt text editing**
- **Real-time preview** while editing
- **Properties panel** for detailed configuration

### 4. Preview Modes
- **Desktop preview** (1200px max width)
- **Tablet preview** (768px max width)
- **Mobile preview** (375px max width)
- **Open preview in modal** before publishing
- **Preview unpublished changes**

### 5. Draft & Publish Workflow
- **Save Draft**: Save work without publishing
- **Publish**: Make page live to visitors
- **Unpublish**: Revert to draft status
- **Auto-save indicators**: Shows unsaved changes and last saved time
- **Confirmation dialogs** for publish/unpublish actions

### 6. Version History
- **Automatic versioning**: Versions created on publish and significant changes
- **Version list**: View all versions with change logs
- **Rollback**: Restore to any previous version
- **Backup before rollback**: Current state saved before rollback
- **Version details**: View title, slug, changes, and timestamp

### 7. Page Settings
- **Basic settings**:
  - Page title
  - URL slug
  - Status (draft/published/archived)
  - Visibility (public/private/password protected)

- **SEO settings**:
  - Meta title
  - Meta description
  - Canonical URL
  - Open Graph image

### 8. Undo/Redo
- **Full history tracking**: Every change is recorded
- **Undo**: Revert to previous state
- **Redo**: Re-apply undone changes
- **Visual indicators**: Shows when undo/redo is available

## Database Schema

### Page
- `id` - Unique identifier
- `projectId` - Associated project
- `title` - Page title
- `slug` - URL slug
- `status` - draft/published/archived/scheduled
- `banner` - Banner image URL
- `template` - Page template
- `sortOrder` - Display order
- `isHome` - Is homepage
- `publishedAt` - Publication timestamp
- `scheduledAt` - Scheduled publication time
- `visibility` - public/private/password
- `password` - Password for protected pages

### PageSection
- `id` - Unique identifier
- `pageId` - Associated page
- `type` - Section type (hero, about, services, etc.)
- `title` - Section title
- `content` - JSON content
- `settings` - JSON settings (background, padding, etc.)
- `sortOrder` - Display order
- `isVisible` - Visibility flag
- `isDeleted` - Soft delete flag
- `parentId` - For nested sections
- `template` - Template variant

### PageVersion
- `id` - Unique identifier
- `pageId` - Associated page
- `version` - Version number
- `title` - Page title at this version
- `slug` - URL slug at this version
- `content` - Full page snapshot
- `sections` - Sections snapshot
- `banner` - Banner at this version
- `seo` - SEO snapshot
- `changeLog` - Description of changes
- `createdBy` - User who created version
- `createdAt` - Creation timestamp

### PageDraft
- `id` - Unique identifier
- `pageId` - Associated page
- `title` - Draft title
- `slug` - Draft slug
- `content` - Draft content
- `sections` - Draft sections
- `banner` - Draft banner
- `seo` - Draft SEO
- `changeLog` - Change description
- `createdBy` - User who created draft
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## API Routes

### Pages
- `GET /api/pages` - List all pages
- `POST /api/pages` - Create new page
- `GET /api/pages/[id]` - Get single page with sections
- `PUT /api/pages/[id]` - Update page
- `DELETE /api/pages/[id]` - Delete page

### Sections
- `GET /api/pages/[id]/sections` - Get all sections
- `POST /api/pages/[id]/sections` - Add new section
- `GET /api/pages/[id]/sections/[sectionId]` - Get single section
- `PUT /api/pages/[id]/sections/[sectionId]` - Update section
- `DELETE /api/pages/[id]/sections/[sectionId]` - Soft delete section
- `PATCH /api/pages/[id]/sections/[sectionId]` - Reorder section

### Versions
- `GET /api/pages/[id]/versions` - Get version history
- `POST /api/pages/[id]/versions` - Create new version
- `GET /api/pages/[id]/versions/[versionId]` - Get specific version
- `POST /api/pages/[id]/versions/[versionId]/rollback` - Rollback to version

### Drafts
- `GET /api/pages/[id]/drafts` - Get all drafts
- `POST /api/pages/[id]/drafts` - Save draft

## Usage

### Accessing the Page Builder

1. Navigate to **Dashboard → Pages**
2. Click **Edit** on any page
3. The page builder will open with a three-panel interface

### Adding Sections

1. Click the **+ Add** button in the left sidebar
2. Browse the section template library
3. Click on a section type to add it
4. The section will be added at the end of the page

### Editing Content

**Method 1: Inline Editing**
- Click directly on text in the preview canvas
- Edit the text
- Click outside to save

**Method 2: Properties Panel**
- Click on a section in the left sidebar or preview
- Edit properties in the right sidebar
- Changes update in real-time

### Reordering Sections

**Method 1: Drag and Drop**
- Click and hold a section in the left sidebar
- Drag to the desired position
- Drop to reorder

**Method 2: Properties Panel**
- Select a section
- Use the sort order controls (if available)

### Hiding/Showing Sections

- Click the **eye icon** (👁/👁‍🗨) on a section
- Hidden sections show a "Hidden" badge
- Hidden sections remain in the page configuration
- Hidden sections are not rendered on the live site

### Deleting Sections

1. Click the **delete icon** (🗑) on a section
2. Confirm the deletion
3. Section is soft-deleted (can be restored before saving)
4. To permanently delete, save the page

### Previewing

1. Click the **Preview** button in the top bar
2. Choose device: Desktop, Tablet, or Mobile
3. View the page as it will appear to visitors
4. Close the preview to continue editing

### Publishing

1. Click the **Publish** button
2. Confirm the action
3. Page status changes to "published"
4. Page is now live on the website

### Saving Drafts

- Click **Save Draft** to save without publishing
- Drafts are stored in the PageDraft table
- You can have multiple drafts
- Unsaved changes indicator shows when changes are pending

### Version History

1. Click **Versions** from the pages list
2. View all versions with change logs
3. Click **View** to see version details
4. Click **Rollback** to restore a previous version
5. Current state is backed up before rollback

### Page Settings

1. Click the **Settings** button in the top bar
2. Configure:
   - Page title and slug
   - Status and visibility
   - SEO settings (meta title, description, etc.)
   - Open Graph settings
3. Click **Save Settings**

## Section Content Structure

Each section type has a specific content structure:

### Hero
```json
{
  "heading": "Welcome",
  "subheading": "Subtitle text",
  "description": "Description text",
  "buttonText": "Get Started",
  "buttonUrl": "#",
  "backgroundImage": "https://...",
  "overlayColor": "#000000",
  "overlayOpacity": 0.5
}
```

### About
```json
{
  "heading": "About Us",
  "content": "About text...",
  "image": "https://...",
  "imageAlt": "About image"
}
```

### Services
```json
{
  "heading": "Our Services",
  "items": [
    {
      "title": "Service 1",
      "description": "Description",
      "icon": "🚀"
    }
  ]
}
```

### Features
```json
{
  "heading": "Features",
  "items": [
    {
      "icon": "✓",
      "title": "Feature 1",
      "description": "Description"
    }
  ]
}
```

### CTA
```json
{
  "heading": "Ready to Start?",
  "description": "Join us",
  "buttonText": "Contact",
  "buttonUrl": "#contact"
}
```

### Testimonials
```json
{
  "heading": "Testimonials",
  "items": [
    {
      "name": "John Doe",
      "role": "CEO",
      "content": "Amazing!",
      "image": "https://...",
      "rating": 5
    }
  ]
}
```

### FAQ
```json
{
  "heading": "FAQ",
  "items": [
    {
      "question": "Question?",
      "answer": "Answer"
    }
  ]
}
```

### Gallery
```json
{
  "heading": "Gallery",
  "items": [
    {
      "image": "https://...",
      "alt": "Image",
      "caption": "Caption"
    }
  ]
}
```

### Contact
```json
{
  "heading": "Contact Us",
  "description": "Get in touch",
  "email": "info@example.com",
  "phone": "+1234567890",
  "address": "123 Street"
}
```

### Statistics
```json
{
  "heading": "Our Achievements",
  "items": [
    {
      "number": "1000+",
      "label": "Clients"
    }
  ]
}
```

### Team
```json
{
  "heading": "Our Team",
  "items": [
    {
      "name": "John Doe",
      "role": "CEO",
      "bio": "Bio",
      "image": "https://..."
    }
  ]
}
```

### Custom HTML
```json
{
  "html": "<div>Custom HTML content</div>"
}
```

## Technical Implementation

### State Management
- React hooks for local state
- Optimistic updates for better UX
- History tracking for undo/redo
- Auto-save indicators

### Drag and Drop
- Native HTML5 drag and drop API
- Visual feedback during drag
- Automatic sort order adjustment

### Real-time Preview
- Live rendering of sections
- Instant updates on content changes
- Device-specific preview modes

### Optimistic Updates
- UI updates immediately
- API calls in background
- Error handling with rollback

## Future Enhancements

- [ ] Rich text editor (TipTap/Quill integration)
- [ ] Media library integration
- [ ] Section templates with pre-configured content
- [ ] Duplicate section functionality
- [ ] Copy/paste sections
- [ ] Multi-language support
- [ ] A/B testing
- [ ] Scheduled publishing
- [ ] Collaborative editing
- [ ] Section animations
- [ ] Custom CSS per section
- [ ] Responsive editing (different content per device)
- [ ] Component library
- [ ] Third-party integrations

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Considerations

- Lazy loading for sections
- Optimistic updates reduce perceived latency
- Debounced auto-save
- Efficient re-rendering with React
- Minimal dependencies

## Security

- Authentication required for all operations
- Authorization checks on all API routes
- XSS prevention with content sanitization
- CSRF protection
- Input validation

## Troubleshooting

### Sections not saving
- Check browser console for errors
- Verify API routes are accessible
- Check database connection
- Ensure user has proper permissions

### Preview not updating
- Clear browser cache
- Check for JavaScript errors
- Verify section content is valid JSON
- Refresh the page

### Drag and drop not working
- Ensure JavaScript is enabled
- Check for conflicting libraries
- Try a different browser
- Clear browser cache

## Support

For issues or questions:
1. Check this documentation
2. Review API route implementations
3. Check browser console for errors
4. Verify database schema is up to date
5. Ensure all dependencies are installed

## Migration Guide

To add the page builder to an existing project:

1. Run database migration:
   ```bash
   cd apps/web
   npx prisma migrate dev --name add-page-builder
   npx prisma generate
   ```

2. The following files are added:
   - `prisma/schema.prisma` - Updated with new models
   - `src/app/api/pages/[id]/sections/` - Section API routes
   - `src/app/api/pages/[id]/versions/` - Version API routes
   - `src/app/api/pages/[id]/drafts/` - Draft API routes
   - `src/app/(dashboard)/dashboard/pages/[id]/` - Page builder UI

3. Update navigation to include page builder links

4. Test with a demo page

## License

Part of the Gobal Backend CMS