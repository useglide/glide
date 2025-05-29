const { fetchAllPages } = require('../utils/canvasAPI');

/**
 * Service for Canvas API operations
 */
const canvasService = {
  /**
   * Get current user information
   * @param {Object} credentials - Canvas API credentials
   * @returns {Promise<Object>} User data
   */
  getUserInfo: async (credentials) => {
    return await fetchAllPages('/api/v1/users/self', {
      ...credentials
    });
  },

  /**
   * Get all available courses
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} List of courses
   */
  getCourses: async (options = {}) => {
    const {
      includeTerms = true,
      includeTeachers = true,
      includeTotalScores = true,
      canvasUrl,
      canvasApiKey
    } = options;

    let url = '/api/v1/courses?state[]=available';

    if (includeTerms) url += '&include[]=term';
    if (includeTeachers) url += '&include[]=teachers';
    if (includeTotalScores) url += '&include[]=total_scores';

    return await fetchAllPages(url, {
      canvasUrl,
      canvasApiKey
    });
  },

  /**
   * Get assignments for a specific course
   * @param {number} courseId - Course ID
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} List of assignments
   */
  getCourseAssignments: async (courseId, options = {}) => {
    const {
      includeSubmission = false,
      dueAfter = null,
      dueBefore = null,
      orderBy = 'due_at',
      perPage = 50,
      canvasUrl,
      canvasApiKey
    } = options;

    let url = `/api/v1/courses/${courseId}/assignments?per_page=${perPage}&order_by=${orderBy}`;

    if (includeSubmission) url += '&include[]=submission';
    if (dueAfter) url += `&due_after=${encodeURIComponent(dueAfter)}`;
    if (dueBefore) url += `&due_before=${encodeURIComponent(dueBefore)}`;

    return await fetchAllPages(url, {
      canvasUrl,
      canvasApiKey
    });
  },

  /**
   * Get detailed information for a specific assignment
   * @param {number} courseId - Course ID
   * @param {number} assignmentId - Assignment ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Assignment details
   */
  getAssignmentDetails: async (courseId, assignmentId, options = {}) => {
    const {
      includeSubmission = true,
      canvasUrl,
      canvasApiKey
    } = options;

    let url = `/api/v1/courses/${courseId}/assignments/${assignmentId}`;

    if (includeSubmission) url += '?include[]=submission';

    return await fetchAllPages(url, {
      canvasUrl,
      canvasApiKey
    });
  },

  /**
   * Get submissions for a specific assignment
   * @param {number} courseId - Course ID
   * @param {number} assignmentId - Assignment ID
   * @param {Object} credentials - Canvas API credentials
   * @returns {Promise<Array>} List of submissions
   */
  getAssignmentSubmissions: async (courseId, assignmentId, credentials) => {
    return await fetchAllPages(`/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions`, {
      ...credentials
    });
  },

  /**
   * Get announcements for all available courses
   * @param {Array} courses - List of courses
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} List of announcements
   */
  getAnnouncements: async (courses, options = {}) => {
    const {
      latestOnly = false,
      startDate = null, // Don't default to a specific date
      canvasUrl,
      canvasApiKey
    } = options;

    // Build context codes for courses (format: course_123)
    const contextCodes = courses.map(course => `course_${course.id}`);

    // If no courses found, return empty array
    if (contextCodes.length === 0) {
      return [];
    }

    // Build the announcements URL with required parameters
    let announcementsUrl = '/api/v1/announcements?' +
      `context_codes[]=${contextCodes.join('&context_codes[]=')}` + // Add context codes for each course
      `&latest_only=${latestOnly}`; // Get all announcements or just the latest

    // Only add start_date if provided
    if (startDate) {
      announcementsUrl += `&start_date=${startDate}`;
    }

    console.log(`Getting announcements for ${courses.length} courses with URL: ${announcementsUrl}`);

    return await fetchAllPages(announcementsUrl, {
      canvasUrl,
      canvasApiKey
    });
  },

  /**
   * Get announcements for a specific course
   * @param {number} courseId - Course ID
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} List of announcements for the course
   */
  getCourseAnnouncements: async (courseId, options = {}) => {
    const {
      canvasUrl,
      canvasApiKey
    } = options;

    console.log(`Fetching announcements for course ${courseId} using working approach`);

    try {
      // First get all courses to use the working approach
      const allCourses = await module.exports.getCourses({
        includeTerms: false,
        includeTeachers: false,
        canvasUrl,
        canvasApiKey
      });

      // Get all announcements using minimal parameters (the approach that works)
      const allAnnouncements = await module.exports.getAnnouncements(allCourses, {
        canvasUrl,
        canvasApiKey
      });

      // Filter for this specific course
      const courseAnnouncements = allAnnouncements.filter(
        a => a.course_id === parseInt(courseId) || a.context_code === `course_${courseId}`
      );

      console.log(`Found ${courseAnnouncements.length} announcements for course ${courseId}`);

      return courseAnnouncements;
    } catch (error) {
      console.error(`Error in getCourseAnnouncements for course ${courseId}:`, error.message);
      throw error;
    }
  },

  /**
   * Get calendar events
   * @param {Object} credentials - Canvas API credentials
   * @returns {Promise<Array>} List of calendar events
   */
  getCalendarEvents: async (credentials) => {
    return await fetchAllPages('/api/v1/calendar_events', {
      ...credentials
    });
  },

  /**
   * Get user's todo items
   * @param {Object} credentials - Canvas API credentials
   * @returns {Promise<Array>} List of todo items
   */
  getTodoItems: async (credentials) => {
    return await fetchAllPages('/api/v1/users/self/todo', {
      ...credentials
    });
  },

  /**
   * Get student submissions for a course
   * @param {number} courseId - Course ID
   * @param {Object} credentials - Canvas API credentials
   * @returns {Promise<Array>} List of submissions
   */
  getCourseSubmissions: async (courseId, credentials) => {
    return await fetchAllPages(`/api/v1/courses/${courseId}/students/submissions?student_ids[]=self`, {
      silentErrors: true,
      ...credentials
    });
  },

  /**
   * Get current courses from Firestore
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} List of current courses
   */
  getCurrentCourses: async (options = {}) => {
    const {
      includeTerms = true,
      includeTeachers = true,
      includeTotalScores = true,
      uid,
      canvasUrl,
      canvasApiKey
    } = options;

    if (!uid) {
      throw new Error('User ID is required to get current courses');
    }

    // Get user's courses from Firestore
    const { db } = require('../config/firebase');
    const coursesSnapshot = await db.collection('users').doc(uid).collection('courses')
      .where('status', '==', 'current')
      .get();

    if (coursesSnapshot.empty) {
      console.warn('No current courses found for user in Firestore');
      return [];
    }

    // Get course IDs from Firestore
    const courseIds = coursesSnapshot.docs.map(doc => parseInt(doc.id));

    // Get all courses from Canvas
    const allCourses = await canvasService.getCourses({
      includeTerms,
      includeTeachers,
      includeTotalScores,
      canvasUrl,
      canvasApiKey
    });

    // Filter courses by IDs from Firestore
    return allCourses.filter(course => courseIds.includes(course.id));
  },

  /**
   * Get all courses (current and past) from Firestore and Canvas
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} List of all courses
   */
  getAllCourses: async (options = {}) => {
    const {
      includeTerms = true,
      includeTeachers = true,
      includeTotalScores = true,
      uid,
      canvasUrl,
      canvasApiKey
    } = options;

    if (!uid) {
      throw new Error('User ID is required to get all courses');
    }

    // Get user's courses from Firestore (both current and past)
    const { db } = require('../config/firebase');
    const coursesSnapshot = await db.collection('users').doc(uid).collection('courses')
      .get();

    if (coursesSnapshot.empty) {
      console.warn('No courses found for user in Firestore');
      return [];
    }

    // Get course IDs from Firestore
    const courseIds = coursesSnapshot.docs.map(doc => parseInt(doc.id));

    // Get all courses from Canvas
    const allCourses = await canvasService.getCourses({
      includeTerms,
      includeTeachers,
      includeTotalScores,
      canvasUrl,
      canvasApiKey
    });

    // Filter courses by IDs from Firestore
    return allCourses.filter(course => courseIds.includes(course.id));
  },

  /**
   * Submit an assignment
   * @param {number} courseId - Course ID
   * @param {number} assignmentId - Assignment ID
   * @param {Object} submissionData - Submission data
   * @param {Object} credentials - Canvas API credentials
   * @returns {Promise<Object>} Submission response
   */
  submitAssignment: async (courseId, assignmentId, submissionData, credentials) => {
    const url = `/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions`;

    // Prepare form data for submission
    const formData = new URLSearchParams();

    // Add submission type
    if (submissionData.submission_type) {
      formData.append('submission[submission_type]', submissionData.submission_type);
    }

    // Add submission content based on type
    if (submissionData.submission_type === 'online_text_entry' && submissionData.body) {
      formData.append('submission[body]', submissionData.body);
    }

    if (submissionData.submission_type === 'online_url' && submissionData.url) {
      formData.append('submission[url]', submissionData.url);
    }

    if (submissionData.submission_type === 'online_upload' && submissionData.file_ids) {
      submissionData.file_ids.forEach(fileId => {
        formData.append('submission[file_ids][]', fileId);
      });
    }

    // Add comment if provided
    if (submissionData.comment) {
      formData.append('comment[text_comment]', submissionData.comment);
    }

    const response = await fetch(`${credentials.canvasUrl}${url}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.canvasApiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Canvas API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  },

  /**
   * Upload a file for submission - Complete workflow
   * @param {number} courseId - Course ID
   * @param {number} assignmentId - Assignment ID
   * @param {number} userId - User ID
   * @param {Object} fileData - File data with file buffer
   * @param {Object} credentials - Canvas API credentials
   * @returns {Promise<Object>} Upload response with file ID
   */
  uploadSubmissionFile: async (courseId, assignmentId, userId, fileData, credentials) => {
    const url = `/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/${userId}/files`;

    // Step 1: Request upload parameters
    const requestParams = {
      name: fileData.name,
      size: fileData.size,
      content_type: fileData.content_type || 'application/octet-stream'
    };

    const step1Response = await fetch(`${credentials.canvasUrl}${url}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.canvasApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestParams)
    });

    if (!step1Response.ok) {
      const errorText = await step1Response.text();
      throw new Error(`Canvas API error (Step 1): ${step1Response.status} - ${errorText}`);
    }

    const uploadInfo = await step1Response.json();
    console.log('Step 1 upload info:', JSON.stringify(uploadInfo, null, 2));

    // Step 2: Upload the file to Canvas storage following Canvas file upload workflow
    const FormData = require('form-data');

    // Validate file data before proceeding
    if (!fileData.buffer || fileData.buffer.length === 0) {
      throw new Error('File buffer is empty or invalid');
    }

    if (fileData.buffer.length !== fileData.size) {
      console.warn(`File size mismatch: buffer length ${fileData.buffer.length} vs reported size ${fileData.size}`);
    }

    console.log('Upload URL:', uploadInfo.upload_url);
    console.log('File param name:', uploadInfo.file_param || 'file');
    console.log('Upload params keys:', Object.keys(uploadInfo.upload_params));
    console.log('File size:', fileData.size);
    console.log('Buffer length:', fileData.buffer.length);

    // Try multiple approaches for form data construction
    let step2Response;
    let lastError;

    // Approach 1: Use form-data with buffer directly
    try {
      const formData = new FormData();

      // Add all upload parameters from Canvas first (these are required and signed)
      const uploadParams = uploadInfo.upload_params;
      Object.keys(uploadParams).forEach(key => {
        formData.append(key, uploadParams[key]);
      });

      // Add the file last (this is critical for Canvas)
      const fileParamName = uploadInfo.file_param || 'file';
      formData.append(fileParamName, fileData.buffer, {
        filename: fileData.name,
        contentType: fileData.content_type || 'application/octet-stream'
      });

      console.log('Attempting upload with form-data (buffer approach)...');

      step2Response = await fetch(uploadInfo.upload_url, {
        method: 'POST',
        headers: formData.getHeaders(),
        body: formData
      });

      console.log('Step 2 response status:', step2Response.status);
      console.log('Step 2 response headers:', Object.fromEntries(step2Response.headers.entries()));

      if (step2Response.ok) {
        console.log('Upload successful with buffer approach');
      } else {
        const errorText = await step2Response.text();
        console.error('Buffer approach failed:', errorText);
        lastError = new Error(`Canvas file upload error (Step 2): ${step2Response.status} - ${errorText}`);
        step2Response = null;
      }
    } catch (fetchError) {
      console.error('Buffer approach fetch error:', fetchError);
      lastError = fetchError;
      step2Response = null;
    }

    // Approach 2: If first approach failed, try with axios (more reliable for multipart)
    if (!step2Response || !step2Response.ok) {
      try {
        console.log('Trying alternative approach with axios...');
        const axios = require('axios');
        const FormData = require('form-data');

        const formData = new FormData();

        // Add all upload parameters from Canvas first
        const uploadParams = uploadInfo.upload_params;
        Object.keys(uploadParams).forEach(key => {
          formData.append(key, uploadParams[key]);
        });

        // Add the file
        const fileParamName = uploadInfo.file_param || 'file';
        formData.append(fileParamName, fileData.buffer, {
          filename: fileData.name,
          contentType: fileData.content_type || 'application/octet-stream'
        });

        const axiosResponse = await axios.post(uploadInfo.upload_url, formData, {
          headers: formData.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 30000 // 30 second timeout
        });

        // Convert axios response to fetch-like response
        step2Response = {
          ok: axiosResponse.status >= 200 && axiosResponse.status < 300,
          status: axiosResponse.status,
          headers: new Map(Object.entries(axiosResponse.headers)),
          json: async () => axiosResponse.data,
          text: async () => JSON.stringify(axiosResponse.data)
        };

        console.log('Axios upload successful, status:', axiosResponse.status);
      } catch (axiosError) {
        console.error('Axios approach also failed:', axiosError.message);
        lastError = axiosError;
        step2Response = null;
      }
    }

    // Approach 3: If both failed, try with a simpler form construction
    if (!step2Response || !step2Response.ok) {
      try {
        console.log('Trying simplified form-data approach...');
        const FormData = require('form-data');
        const formData = new FormData();

        // Add upload parameters in the exact order Canvas expects
        const uploadParams = uploadInfo.upload_params;

        // Some Canvas installations are very particular about parameter order
        const paramOrder = ['filename', 'content_type', 'success_action_redirect', 'success_action_status'];

        // Add known parameters first in expected order
        paramOrder.forEach(param => {
          if (uploadParams[param]) {
            formData.append(param, uploadParams[param]);
          }
        });

        // Add any remaining parameters
        Object.keys(uploadParams).forEach(key => {
          if (!paramOrder.includes(key)) {
            formData.append(key, uploadParams[key]);
          }
        });

        // Add the file last
        const fileParamName = uploadInfo.file_param || 'file';
        formData.append(fileParamName, fileData.buffer, fileData.name);

        step2Response = await fetch(uploadInfo.upload_url, {
          method: 'POST',
          body: formData
          // Let form-data set the headers automatically
        });

        console.log('Simplified approach response status:', step2Response.status);

        if (!step2Response.ok) {
          const errorText = await step2Response.text();
          console.error('Simplified approach failed:', errorText);
          throw new Error(`Canvas file upload error (Step 2): ${step2Response.status} - ${errorText}`);
        }
      } catch (simplifiedError) {
        console.error('Simplified approach also failed:', simplifiedError.message);
        throw lastError || simplifiedError;
      }
    }

    if (!step2Response || !step2Response.ok) {
      throw lastError || new Error('All upload approaches failed');
    }

    // Step 3: Follow Canvas file upload workflow - handle redirects properly
    let fileInfo;

    if (step2Response.status === 201) {
      // File created successfully, get file info directly from response
      try {
        fileInfo = await step2Response.json();
        console.log('File upload response (201):', fileInfo);
      } catch (e) {
        // If JSON parsing fails, check for Location header
        const locationHeader = step2Response.headers.get('Location');
        if (locationHeader) {
          console.log('201 response but following Location header:', locationHeader);
          fileInfo = await this.followCanvasRedirect(locationHeader, credentials);
        } else {
          console.error('Failed to parse 201 response as JSON and no Location header:', e);
          throw new Error('Failed to parse file upload response');
        }
      }
    } else if (step2Response.status >= 300 && step2Response.status < 400) {
      // Handle redirect (301, 302, 303, etc.)
      const locationHeader = step2Response.headers.get('Location');
      if (locationHeader) {
        console.log('Following redirect to:', locationHeader);
        fileInfo = await this.followCanvasRedirect(locationHeader, credentials);
      } else {
        throw new Error('Redirect response but no Location header');
      }
    } else if (step2Response.status === 200) {
      // Some Canvas installations might return 200
      try {
        fileInfo = await step2Response.json();
        console.log('File upload response (200):', fileInfo);
      } catch (e) {
        console.error('Failed to parse 200 response as JSON:', e);
        throw new Error('Failed to parse file upload response');
      }
    } else {
      throw new Error(`Unexpected response status: ${step2Response.status}`);
    }

    // Validate that we got file information
    if (!fileInfo || !fileInfo.id) {
      console.error('Invalid file info received:', fileInfo);
      throw new Error('No valid file ID received from Canvas');
    }

    return {
      file_id: fileInfo.id,
      file_name: fileInfo.filename,
      file_size: fileInfo.size,
      content_type: fileInfo['content-type']
    };
  },

  /**
   * Get detailed submission information including attachments
   * @param {number} courseId - Course ID
   * @param {number} assignmentId - Assignment ID
   * @param {number} userId - User ID
   * @param {Object} credentials - Canvas API credentials
   * @returns {Promise<Object>} Detailed submission information
   */
  getSubmissionDetails: async (courseId, assignmentId, userId, credentials) => {
    const url = `/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/${userId}?include[]=submission_history&include[]=submission_comments&include[]=rubric_assessment&include[]=attachments`;

    return await fetchAllPages(url, {
      ...credentials
    });
  },

  /**
   * Download a submitted file from Canvas
   * @param {number} fileId - File ID
   * @param {Object} credentials - Canvas API credentials
   * @returns {Promise<Object>} File buffer and metadata
   */
  downloadSubmissionFile: async (fileId, credentials) => {
    const { canvasUrl, canvasApiKey } = credentials;

    console.log('Downloading file:', fileId, 'from Canvas URL:', canvasUrl);

    // First get file information
    const fileInfoUrl = `/api/v1/files/${fileId}`;
    const fileInfo = await fetchAllPages(fileInfoUrl, {
      ...credentials
    });

    console.log('File info received:', fileInfo);

    if (!fileInfo || !fileInfo.url) {
      throw new Error('File not found or no download URL available');
    }

    console.log('Downloading from URL:', fileInfo.url);

    // Download the file using the Canvas file URL
    const response = await fetch(fileInfo.url, {
      headers: {
        'Authorization': `Bearer ${canvasApiKey}`
      }
    });

    console.log('Download response status:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }

    // Convert response to buffer
    const buffer = await response.arrayBuffer();

    console.log('File downloaded successfully, buffer size:', buffer.byteLength);

    return {
      buffer: Buffer.from(buffer),
      filename: fileInfo.filename || `file_${fileId}`,
      contentType: fileInfo['content-type'] || 'application/octet-stream',
      size: fileInfo.size
    };
  },

  /**
   * Follow Canvas redirect to complete file upload
   * @param {string} redirectUrl - The redirect URL from Canvas
   * @param {Object} credentials - Canvas API credentials
   * @returns {Promise<Object>} File information
   */
  followCanvasRedirect: async (redirectUrl, credentials) => {
    console.log('Following Canvas redirect:', redirectUrl);

    // Canvas documentation says to use POST with Content-Length: 0 for the redirect
    const confirmResponse = await fetch(redirectUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.canvasApiKey}`,
        'Content-Length': '0'
      }
    });

    if (!confirmResponse.ok) {
      const errorText = await confirmResponse.text();
      console.error('Redirect confirmation failed:', errorText);
      throw new Error(`Failed to confirm upload via redirect: ${confirmResponse.status} - ${errorText}`);
    }

    const fileInfo = await confirmResponse.json();
    console.log('File info from redirect confirmation:', fileInfo);
    return fileInfo;
  }
};

module.exports = canvasService;
