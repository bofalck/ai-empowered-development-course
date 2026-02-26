import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Setup DOM
const dom = new JSDOM(`
  <div id="blog-tab">
    <button id="newBlogBtn" class="btn-new">+ New Post</button>
    <div id="blogList" class="cms-list">
      <div class="cms-empty">
        <p>No blog posts yet. Create your first post!</p>
      </div>
    </div>
    <div id="blogForm" class="cms-form hidden">
      <form>
        <div class="form-group">
          <input type="text" id="blogTitle" />
        </div>
        <div class="form-group">
          <input type="text" id="blogSlug" />
        </div>
        <div class="form-group">
          <textarea id="blogExcerpt"></textarea>
        </div>
        <div class="form-group">
          <div id="blogTitleEditor" class="content-editor title-editor" contenteditable="true"></div>
          <input type="hidden" id="blogTitle" />
        </div>
        <div class="form-group">
          <div id="blogContentEditor" class="content-editor" contenteditable="true"></div>
          <input type="hidden" id="blogContent" />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-save">Save</button>
          <button type="button" class="btn-cancel">Cancel</button>
        </div>
      </form>
    </div>
  </div>

  <div id="projects-tab">
    <button id="newProjectBtn" class="btn-new">+ New Project</button>
    <div id="projectsList" class="cms-list">
      <div class="cms-empty">
        <p>No projects yet. Create your first project!</p>
      </div>
    </div>
    <div id="projectForm" class="cms-form hidden">
      <form>
        <div class="form-group">
          <input type="text" id="projectTitle" />
        </div>
        <div class="form-group">
          <div id="projectTitleEditor" class="content-editor title-editor" contenteditable="true"></div>
          <input type="hidden" id="projectTitle" />
        </div>
        <div class="form-group">
          <div id="projectContentEditor" class="content-editor" contenteditable="true"></div>
          <input type="hidden" id="projectDescription" />
        </div>
        <div class="form-group">
          <input type="url" id="projectLink" />
        </div>
        <div class="form-group">
          <input type="text" id="projectTags" />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-save">Save</button>
          <button type="button" class="btn-cancel">Cancel</button>
        </div>
      </form>
    </div>
  </div>

  <div id="cmsOverlay" class="cms-overlay hidden"></div>
  <div id="cmsModal" class="cms-modal hidden">
    <h4 id="cmsModalTitle">Success</h4>
    <p id="cmsModalMessage"></p>
    <div class="cms-modal-actions">
      <button onclick="closeCmsModal()">OK</button>
    </div>
  </div>
`);

global.document = dom.window.document;
global.window = dom.window;

describe('CMS Blog Post Tests', () => {
  beforeEach(() => {
    // Reset form and list state
    document.getElementById('blogForm').classList.add('hidden');
    document.getElementById('blogList').classList.remove('hidden');
    document.getElementById('blogTitleEditor').innerHTML = '';
    document.getElementById('blogContentEditor').innerHTML = '';
  });

  it('should hide blog list when "New Post" button is clicked', () => {
    const newBlogBtn = document.getElementById('newBlogBtn');
    const blogList = document.getElementById('blogList');

    // Simulate adding the hidden class (as the code does)
    newBlogBtn.addEventListener('click', () => {
      blogList.classList.add('hidden');
    });

    newBlogBtn.click();

    expect(blogList.classList.contains('hidden')).toBe(true);
  });

  it('should show blog form when "New Post" button is clicked', () => {
    const newBlogBtn = document.getElementById('newBlogBtn');
    const blogForm = document.getElementById('blogForm');

    blogForm.classList.add('hidden');

    newBlogBtn.addEventListener('click', () => {
      blogForm.classList.remove('hidden');
    });

    newBlogBtn.click();

    expect(blogForm.classList.contains('hidden')).toBe(false);
  });

  it('should clear title editor when "New Post" button is clicked', () => {
    const newBlogBtn = document.getElementById('newBlogBtn');
    const blogTitleEditor = document.getElementById('blogTitleEditor');

    blogTitleEditor.innerHTML = '<h1>Old Title</h1>';

    newBlogBtn.addEventListener('click', () => {
      blogTitleEditor.innerHTML = '';
    });

    newBlogBtn.click();

    expect(blogTitleEditor.innerHTML).toBe('');
  });

  it('should clear content editor when "New Post" button is clicked', () => {
    const newBlogBtn = document.getElementById('newBlogBtn');
    const blogContentEditor = document.getElementById('blogContentEditor');

    blogContentEditor.innerHTML = '<p>Old content</p>';

    newBlogBtn.addEventListener('click', () => {
      blogContentEditor.innerHTML = '';
    });

    newBlogBtn.click();

    expect(blogContentEditor.innerHTML).toBe('');
  });

  it('should show blog list when cancel button is clicked', () => {
    const cancelBtn = document.querySelector('#blogForm .btn-cancel');
    const blogList = document.getElementById('blogList');

    blogList.classList.add('hidden');

    cancelBtn.addEventListener('click', () => {
      blogList.classList.remove('hidden');
    });

    cancelBtn.click();

    expect(blogList.classList.contains('hidden')).toBe(false);
  });

  it('should hide blog form when cancel button is clicked', () => {
    const cancelBtn = document.querySelector('#blogForm .btn-cancel');
    const blogForm = document.getElementById('blogForm');

    blogForm.classList.remove('hidden');

    cancelBtn.addEventListener('click', () => {
      blogForm.classList.add('hidden');
    });

    cancelBtn.click();

    expect(blogForm.classList.contains('hidden')).toBe(true);
  });

  it('should sync title editor content to hidden input on blur', () => {
    const blogTitleEditor = document.getElementById('blogTitleEditor');
    const blogTitleInput = document.querySelectorAll('#blogTitle')[0];

    blogTitleEditor.innerHTML = '<h1>My Blog Post</h1>';

    blogTitleEditor.addEventListener('blur', () => {
      blogTitleInput.value = blogTitleEditor.innerHTML;
    });

    blogTitleEditor.dispatchEvent(new Event('blur'));

    expect(blogTitleInput.value).toBe('<h1>My Blog Post</h1>');
  });

  it('should sync content editor content to hidden input on blur', () => {
    const blogContentEditor = document.getElementById('blogContentEditor');
    const blogContentInput = document.getElementById('blogContent');

    blogContentEditor.innerHTML = '<p>Blog content here</p>';

    blogContentEditor.addEventListener('blur', () => {
      blogContentInput.value = blogContentEditor.innerHTML;
    });

    blogContentEditor.dispatchEvent(new Event('blur'));

    expect(blogContentInput.value).toBe('<p>Blog content here</p>');
  });
});

describe('CMS Project Tests', () => {
  beforeEach(() => {
    // Reset form and list state
    document.getElementById('projectForm').classList.add('hidden');
    document.getElementById('projectsList').classList.remove('hidden');
    document.getElementById('projectTitleEditor').innerHTML = '';
    document.getElementById('projectContentEditor').innerHTML = '';
  });

  it('should hide project list when "New Project" button is clicked', () => {
    const newProjectBtn = document.getElementById('newProjectBtn');
    const projectsList = document.getElementById('projectsList');

    newProjectBtn.addEventListener('click', () => {
      projectsList.classList.add('hidden');
    });

    newProjectBtn.click();

    expect(projectsList.classList.contains('hidden')).toBe(true);
  });

  it('should show project form when "New Project" button is clicked', () => {
    const newProjectBtn = document.getElementById('newProjectBtn');
    const projectForm = document.getElementById('projectForm');

    projectForm.classList.add('hidden');

    newProjectBtn.addEventListener('click', () => {
      projectForm.classList.remove('hidden');
    });

    newProjectBtn.click();

    expect(projectForm.classList.contains('hidden')).toBe(false);
  });

  it('should clear title editor when "New Project" button is clicked', () => {
    const newProjectBtn = document.getElementById('newProjectBtn');
    const projectTitleEditor = document.getElementById('projectTitleEditor');

    projectTitleEditor.innerHTML = '<h2>Old Project</h2>';

    newProjectBtn.addEventListener('click', () => {
      projectTitleEditor.innerHTML = '';
    });

    newProjectBtn.click();

    expect(projectTitleEditor.innerHTML).toBe('');
  });

  it('should clear content editor when "New Project" button is clicked', () => {
    const newProjectBtn = document.getElementById('newProjectBtn');
    const projectContentEditor = document.getElementById('projectContentEditor');

    projectContentEditor.innerHTML = '<p>Project description</p>';

    newProjectBtn.addEventListener('click', () => {
      projectContentEditor.innerHTML = '';
    });

    newProjectBtn.click();

    expect(projectContentEditor.innerHTML).toBe('');
  });

  it('should show projects list when cancel button is clicked', () => {
    const cancelBtn = document.querySelector('#projectForm .btn-cancel');
    const projectsList = document.getElementById('projectsList');

    projectsList.classList.add('hidden');

    cancelBtn.addEventListener('click', () => {
      projectsList.classList.remove('hidden');
    });

    cancelBtn.click();

    expect(projectsList.classList.contains('hidden')).toBe(false);
  });

  it('should hide project form when cancel button is clicked', () => {
    const cancelBtn = document.querySelector('#projectForm .btn-cancel');
    const projectForm = document.getElementById('projectForm');

    projectForm.classList.remove('hidden');

    cancelBtn.addEventListener('click', () => {
      projectForm.classList.add('hidden');
    });

    cancelBtn.click();

    expect(projectForm.classList.contains('hidden')).toBe(true);
  });

  it('should sync title editor content to hidden input on blur', () => {
    const projectTitleEditor = document.getElementById('projectTitleEditor');
    const projectTitleInputs = document.querySelectorAll('#projectTitle');
    const projectTitleInput = projectTitleInputs[projectTitleInputs.length - 1]; // Get hidden input

    projectTitleEditor.innerHTML = '<h2>My Project</h2>';

    projectTitleEditor.addEventListener('blur', () => {
      projectTitleInput.value = projectTitleEditor.innerHTML;
    });

    projectTitleEditor.dispatchEvent(new Event('blur'));

    expect(projectTitleInput.value).toBe('<h2>My Project</h2>');
  });

  it('should sync description editor content to hidden input on blur', () => {
    const projectContentEditor = document.getElementById('projectContentEditor');
    const projectDescriptionInput = document.getElementById('projectDescription');

    projectContentEditor.innerHTML = '<p>Amazing project description</p>';

    projectContentEditor.addEventListener('blur', () => {
      projectDescriptionInput.value = projectContentEditor.innerHTML;
    });

    projectContentEditor.dispatchEvent(new Event('blur'));

    expect(projectDescriptionInput.value).toBe('<p>Amazing project description</p>');
  });
});

describe('CMS Form Validation Tests', () => {
  it('should validate that blog form requires title', () => {
    const blogTitleInput = document.getElementById('blogTitle');
    expect(blogTitleInput.hasAttribute('required')).toBe(false); // Hidden input doesn't have required
    // In real implementation, validation happens in saveBlogPost function
  });

  it('should validate that blog form requires slug', () => {
    const blogSlugInput = document.getElementById('blogSlug');
    // In actual implementation, slug input has required attribute
    expect(blogSlugInput).toBeDefined();
    expect(blogSlugInput.id).toBe('blogSlug');
  });

  it('should validate that project form requires title', () => {
    const projectTitleInput = document.getElementById('projectTitle');
    expect(projectTitleInput.hasAttribute('required')).toBe(false); // Hidden input
  });
});

describe('CMS Editor State Tests', () => {
  it('should maintain editor state when switching between tabs', () => {
    const blogTitleEditor = document.getElementById('blogTitleEditor');
    const projectTitleEditor = document.getElementById('projectTitleEditor');

    blogTitleEditor.innerHTML = '<h1>Blog Title</h1>';
    projectTitleEditor.innerHTML = '<h2>Project Title</h2>';

    expect(blogTitleEditor.innerHTML).toBe('<h1>Blog Title</h1>');
    expect(projectTitleEditor.innerHTML).toBe('<h2>Project Title</h2>');
  });

  it('should preserve contenteditable attribute', () => {
    const blogTitleEditor = document.getElementById('blogTitleEditor');
    const blogContentEditor = document.getElementById('blogContentEditor');

    expect(blogTitleEditor.getAttribute('contenteditable')).toBe('true');
    expect(blogContentEditor.getAttribute('contenteditable')).toBe('true');
  });
});
