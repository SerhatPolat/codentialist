import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/tasks/route';
import { getServerSession } from 'next-auth/next';
import { connectToDatabase } from '@/lib/db';
import Task from '@/models/Task';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('@/lib/db');
jest.mock('@/models/Task', () => ({
  findById: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.Mock;
const mockConnectToDatabase = connectToDatabase as jest.Mock;
const mockTask = Task as jest.Mocked<typeof Task>;

const originalFetch = global.fetch;

beforeAll(() => {
  mockConnectToDatabase.mockResolvedValue(true);

  global.fetch = jest.fn((url: RequestInfo, init?: RequestInit) => {
    const stringUrl = String(url);
    if (stringUrl.includes('/repos/')) {
      if (stringUrl.includes('owner/valid-repo') ||
          stringUrl.includes('owner/repo-with-task') ||
          stringUrl.includes('owner/repo-to-update') ||
          stringUrl.includes('owner/repo-to-delete') ||
          stringUrl.includes('owner/repo-for-post')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
      }
      if (stringUrl.includes('owner/denied-repo')) {
        return Promise.resolve({ ok: false, status: 403, statusText: 'Forbidden' });
      }
    }
    return originalFetch(url, init);
  });
});

afterAll(() => {
  global.fetch = originalFetch;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Tasks API', () => {
  const mockSession = { accessToken: 'test-token' };

  describe('GET /api/tasks', () => {
    it('should return 401 if unauthorized', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/tasks');
      const response = await GET(req);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 if no parameters are provided', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      const req = new NextRequest('http://localhost/api/tasks');
      const response = await GET(req);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Missing parameters' });
    });

    it('should return a single task by ID with access', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      const mockTaskData = {
        _id: 'task123',
        title: 'Test Task',
        description: 'Test Description',
        repository: 'owner/repo-with-task',
        status: 'Pending',
        filesSnapshot: [],
      };
      mockTask.findById.mockResolvedValue(mockTaskData);

      const req = new NextRequest('http://localhost/api/tasks?id=task123');
      const response = await GET(req);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(mockTaskData);
      expect(mockTask.findById).toHaveBeenCalledWith('task123');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo-with-task',
        expect.any(Object)
      );
    });

    it('should return 404 if task by ID not found', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockTask.findById.mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/tasks?id=nonexistent');
      const response = await GET(req);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'Task not found' });
      expect(mockTask.findById).toHaveBeenCalledWith('nonexistent');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return tasks by repository with access', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      const mockTasks = [
        { _id: 'task1', title: 'Task 1', repository: 'owner/valid-repo' },
        { _id: 'task2', title: 'Task 2', repository: 'owner/valid-repo' },
      ];
      mockTask.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockTasks) } as any);

      const req = new NextRequest('http://localhost/api/tasks?repository=owner/valid-repo');
      const response = await GET(req);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(mockTasks);
      expect(mockTask.find).toHaveBeenCalledWith({ repository: 'owner/valid-repo' });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/valid-repo',
        expect.any(Object)
      );
    });

    it('should return 403 if repository access is denied for GET by ID', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      const mockTaskData = {
        _id: 'task123',
        title: 'Test Task',
        description: 'Test Description',
        repository: 'owner/denied-repo',
        status: 'Pending',
        filesSnapshot: [],
      };
      mockTask.findById.mockResolvedValue(mockTaskData);

      const req = new NextRequest('http://localhost/api/tasks?id=task123');
      const response = await GET(req);
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: 'Forbidden: Access denied' });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/denied-repo',
        expect.any(Object)
      );
    });

    it('should return 403 if repository access is denied for GET by repository', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      const req = new NextRequest('http://localhost/api/tasks?repository=owner/denied-repo');
      const response = await GET(req);
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: 'Forbidden: Access denied' });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/denied-repo',
        expect.any(Object)
      );
    });
  });

  describe('POST /api/tasks', () => {
    it('should return 401 if unauthorized', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/tasks', { method: 'POST', body: JSON.stringify({}) });
      const response = await POST(req);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 if missing required data', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      const req = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Task', repository: 'owner/repo' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Missing required task data' });
    });

    it('should return 403 if repository access is denied', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      const req = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Task',
          description: 'Description',
          repository: 'owner/denied-repo',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(req);
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: 'Forbidden: Access denied' });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/denied-repo',
        expect.any(Object)
      );
    });

    it('should create a new task', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      const newTaskData = {
        title: 'New Task',
        description: 'New Description',
        repository: 'owner/repo-for-post',
      };
      const createdTask = { _id: 'newId', ...newTaskData, status: 'Pending', filesSnapshot: [], createdAt: '...', updatedAt: '...' };
      mockTask.create.mockResolvedValue(createdTask);

      const req = new NextRequest('http://localhost/api/tasks', {
        method: 'POST',
        body: JSON.stringify(newTaskData),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(req);
      expect(response.status).toBe(201);
      expect(await response.json()).toEqual(createdTask);
      expect(mockTask.create).toHaveBeenCalledWith(expect.objectContaining({
        title: newTaskData.title,
        description: newTaskData.description,
        repository: newTaskData.repository,
        status: 'Pending',
        filesSnapshot: [],
      }));
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo-for-post',
        expect.any(Object)
      );
    });
  });

  describe('PUT /api/tasks', () => {
    it('should return 401 if unauthorized', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/tasks', { method: 'PUT', body: JSON.stringify({}) });
      const response = await PUT(req);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 if task ID is missing', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      const req = new NextRequest('http://localhost/api/tasks', { method: 'PUT', body: JSON.stringify({}) });
      const response = await PUT(req);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Task ID is required' });
    });

    it('should return 404 if task not found', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockTask.findById.mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/tasks', {
        method: 'PUT',
        body: JSON.stringify({ id: 'nonexistent', title: 'Updated' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await PUT(req);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'Task not found' });
      expect(mockTask.findById).toHaveBeenCalledWith('nonexistent');
      expect(mockTask.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should return 403 if repository access is denied for PUT', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      const existingTask = {
        _id: 'task1',
        repository: 'owner/denied-repo',
        title: 'Original Title',
        description: 'Original Desc',
        status: 'Pending',
        filesSnapshot: [],
      };
      mockTask.findById.mockResolvedValue(existingTask);

      const req = new NextRequest('http://localhost/api/tasks', {
        method: 'PUT',
        body: JSON.stringify({ id: 'task1', status: 'In Progress' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await PUT(req);
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: 'Forbidden: Access denied' });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/denied-repo',
        expect.any(Object)
      );
    });

    it('should update an existing task with access', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      const existingTask = {
        _id: 'task1',
        repository: 'owner/repo-to-update',
        title: 'Original Title',
        description: 'Original Desc',
        status: 'Pending',
        filesSnapshot: [],
      };
      const updatedTaskData = { ...existingTask, status: 'In Progress' };
      mockTask.findById.mockResolvedValue(existingTask);
      mockTask.findByIdAndUpdate.mockResolvedValue(updatedTaskData);

      const req = new NextRequest('http://localhost/api/tasks', {
        method: 'PUT',
        body: JSON.stringify({ id: 'task1', status: 'In Progress' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await PUT(req);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(updatedTaskData);
      expect(mockTask.findById).toHaveBeenCalledWith('task1');
      expect(mockTask.findByIdAndUpdate).toHaveBeenCalledWith('task1', { status: 'In Progress' }, { returnDocument: 'after' });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo-to-update',
        expect.any(Object)
      );
    });
  });

  describe('DELETE /api/tasks', () => {
    it('should return 401 if unauthorized', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/tasks?id=task123', { method: 'DELETE' });
      const response = await DELETE(req);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 if task ID is missing', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      const req = new NextRequest('http://localhost/api/tasks', { method: 'DELETE' });
      const response = await DELETE(req);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Task ID is required' });
    });

    it('should return 404 if task not found', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockTask.findById.mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/tasks?id=nonexistent', { method: 'DELETE' });
      const response = await DELETE(req);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'Task not found' });
      expect(mockTask.findById).toHaveBeenCalledWith('nonexistent');
      expect(mockTask.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('should return 403 if repository access is denied for DELETE', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      const existingTask = {
        _id: 'task1',
        repository: 'owner/denied-repo',
        title: 'Task to Delete',
        description: 'Description',
        status: 'Pending',
        filesSnapshot: [],
      };
      mockTask.findById.mockResolvedValue(existingTask);

      const req = new NextRequest('http://localhost/api/tasks?id=task1', { method: 'DELETE' });
      const response = await DELETE(req);
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: 'Forbidden: Access denied' });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/denied-repo',
        expect.any(Object)
      );
    });

    it('should delete a task with access', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      const existingTask = {
        _id: 'task1',
        repository: 'owner/repo-to-delete',
        title: 'Task to Delete',
        description: 'Description',
        status: 'Pending',
        filesSnapshot: [],
      };
      mockTask.findById.mockResolvedValue(existingTask);
      mockTask.findByIdAndDelete.mockResolvedValue(existingTask);

      const req = new NextRequest('http://localhost/api/tasks?id=task1', { method: 'DELETE' });
      const response = await DELETE(req);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ message: 'Task deleted successfully' });
      expect(mockTask.findById).toHaveBeenCalledWith('task1');
      expect(mockTask.findByIdAndDelete).toHaveBeenCalledWith('task1');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo-to-delete',
        expect.any(Object)
      );
    });
  });
});
