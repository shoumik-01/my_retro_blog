// Updated page navigation function that preserves scroll position
function showPage(pageId, event) {
    // Prevent default anchor behavior if event is provided
    if (event) {
        event.preventDefault();
    }

    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    document.getElementById(pageId).classList.add('active');

    // Load content when thoughts page is shown
    if (pageId === 'thoughts') {
        loadContentEntries();
    } else if (pageId === 'links') {
        loadUsefulLinks();
    }

    // Update URL without causing page refresh
    history.pushState(null, null, '#' + pageId);
}

// Handle browser back/forward navigation
window.addEventListener('popstate', function() {
    const hash = window.location.hash.substring(1) || 'home';
    showPage(hash);
});

// Handle initial page load based on URL hash
document.addEventListener('DOMContentLoaded', function() {
    const hash = window.location.hash.substring(1) || 'home';
    showPage(hash);
});

// For RSS feed functionality, you would typically need a server-side solution
// This is just a placeholder for demonstration
document.querySelector('.rss-button').addEventListener('click', function(e) {
    e.preventDefault();
    alert('RSS feed would be available at yourblog.com/rss.xml\nImplementing a full RSS feed requires server-side code.');
});

// Function to load content entries from JSON metadata file
function loadContentEntries() {
    const contentContainer = document.getElementById('content-container');

    // Fetch the metadata JSON file
    fetch('data/content-metadata.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load content metadata');
            }
            return response.json();
        })
        .then(data => {
            // Clear loading message
            contentContainer.innerHTML = '';

            // Sort by date (newest first)
            data.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Generate HTML for each content entry
            data.forEach(item => {
                const contentEntry = document.createElement('div');
                contentEntry.className = 'content-entry';

                // Create title with type badge
                const titleContainer = document.createElement('div');
                titleContainer.style.display = 'flex';
                titleContainer.style.alignItems = 'center';

                const typeBadge = document.createElement('span');
                typeBadge.className = 'content-type-badge ' + 
                    (item.type === 'pdf' ? 'pdf-badge' : 
                     item.type === 'video' ? 'video-badge' : 
                     'txt-badge');
                typeBadge.textContent = item.type.toUpperCase();
                titleContainer.appendChild(typeBadge);

                const title = document.createElement('h3');
                title.className = 'content-title';
                title.style.marginLeft = '5px';
                title.textContent = item.title;
                titleContainer.appendChild(title);

                contentEntry.appendChild(titleContainer);

                // Create metadata line
                const meta = document.createElement('div');
                meta.className = 'content-meta';

                // Format date
                const date = new Date(item.date);
                const formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                meta.textContent = `Posted on ${formattedDate}`;
                if (item.category) {
                    meta.textContent += ` â€¢ Category: ${item.category}`;
                }
                contentEntry.appendChild(meta);

                // Create description
                if (item.description) {
                    const desc = document.createElement('div');
                    desc.className = 'content-description';
                    desc.textContent = item.description;
                    contentEntry.appendChild(desc);
                }

                // Create tags if available
                if (item.tags && item.tags.length > 0) {
                    const tagsContainer = document.createElement('div');
                    tagsContainer.className = 'content-tags';

                    item.tags.forEach(tag => {
                        const tagSpan = document.createElement('span');
                        tagSpan.className = 'content-tag';
                        tagSpan.textContent = tag;
                        tagsContainer.appendChild(tagSpan);
                    });

                    contentEntry.appendChild(tagsContainer);
                }

                // Handle different content types
                if (item.type === 'video') {
                    // Create YouTube embed
                    const videoContainer = document.createElement('div');
                    videoContainer.className = 'video-container';

                    const iframe = document.createElement('iframe');
                    iframe.src = `https://www.youtube.com/embed/${item.videoId}`;
                    iframe.title = item.title;
                    iframe.frameBorder = '0';
                    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                    iframe.allowFullscreen = true;

                    videoContainer.appendChild(iframe);
                    contentEntry.appendChild(videoContainer);
                } else if (item.type === 'txt') {
                    // For text files, add a preview container
                    const textPreviewContainer = document.createElement('div');
                    textPreviewContainer.className = 'text-preview-container';
                    textPreviewContainer.textContent = 'Loading post content...';
                    contentEntry.appendChild(textPreviewContainer);

                    // Fetch the text file content
                    fetch(item.filePath)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Failed to load text file: ${item.filePath}`);
                            }
                            return response.text();
                        })
                        .then(textContent => {
                            // Create a formatted blog post from the text content
                            const blogPostContent = document.createElement('div');
                            blogPostContent.className = 'blog-post-content';
                            
                            // Split text by paragraphs and create paragraph elements
                            const paragraphs = textContent.split(/\n\s*\n/);
                            paragraphs.forEach(paragraph => {
                                if (paragraph.trim()) {
                                    const p = document.createElement('p');
                                    p.textContent = paragraph.trim();
                                    blogPostContent.appendChild(p);
                                }
                            });

                            // Replace the loading message with the actual content
                            textPreviewContainer.innerHTML = '';
                            textPreviewContainer.appendChild(blogPostContent);
                        })
                        .catch(error => {
                            console.error('Error loading text file:', error);
                            textPreviewContainer.innerHTML = `
                                <div class="error-message">
                                    Failed to load post content. Please try again later.
                                </div>
                            `;
                        });
                }

                // Create link based on content type
                const link = document.createElement('a');
                link.className = 'content-link';

                if (item.type === 'pdf') {
                    link.href = item.filePath;
                    link.textContent = 'View PDF';
                    link.target = '_blank'; // Open in new tab
                } else if (item.type === 'video') {
                    link.href = `https://www.youtube.com/watch?v=${item.videoId}`;
                    link.textContent = 'Watch on YouTube';
                    link.target = '_blank'; // Open in new tab
                } else if (item.type === 'txt') {
                    link.href = item.filePath;
                    link.textContent = 'View Raw Text';
                    link.target = '_blank'; // Open in new tab
                }

                contentEntry.appendChild(link);

                // Add entry to container
                contentContainer.appendChild(contentEntry);
            });
        })
        .catch(error => {
            console.error('Error loading content metadata:', error);
            contentContainer.innerHTML = `
                <div style="text-align: center; color: var(--accent);">
                    <p>Failed to load content. Please try again later.</p>
                </div>
            `;
        });
}

// Add function to load useful links
function loadUsefulLinks() {
    const linksContainer = document.getElementById('links-container');

    // Fetch the links JSON file
    fetch('data/useful-links.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load useful links');
            }
            return response.json();
        })
        .then(data => {
            // Clear loading message
            linksContainer.innerHTML = '';

            // Generate HTML for each link
            data.forEach(item => {
                const linkItem = document.createElement('div');
                linkItem.className = 'link-item';

                const link = document.createElement('a');
                link.href = item.link;
                link.className = 'link-title';
                link.textContent = item.title;
                link.target = '_blank'; // Open in new tab

                linkItem.appendChild(link);
                linksContainer.appendChild(linkItem);
            });
        })
        .catch(error => {
            console.error('Error loading useful links:', error);
            linksContainer.innerHTML = `
                <div style="text-align: center; color: var(--accent);">
                    <p>Failed to load links. Please try again later.</p>
                </div>
            `;
        });
}
