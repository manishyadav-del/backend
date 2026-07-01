// Path: redux/blogsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Blog } from '@/lib/types';

// Async thunk to fetch blogs from the API
export const fetchBlogs = createAsyncThunk(
  'blogs/fetchBlogs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/dashboard/blogs/recent');
      if (!response.ok) {
        throw new Error('Failed to fetch blogs.');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue({error: (error as Error).message});
    }
  }
);

// Async thunk to "soft-delete" a blog
export const deleteBlog = createAsyncThunk(
    'blogs/deleteBlog',
    async (blogId: number, { rejectWithValue }) => {
      try {
        const response = await fetch('/api/dashboard/blogs/delete', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ blogId }),
        });
        if (!response.ok) {
          throw new Error('Failed to delete blog.');
        }
        return blogId;
      } catch (error) {
        return rejectWithValue({error: (error as Error).message});
      }
    }
);


interface BlogsState {
    blogs: Blog[];
    totalBlogs: number;
    totalMagazines: number;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: BlogsState = {
    blogs: [],
    totalBlogs: 0,
    totalMagazines: 0,
    status: 'idle',
    error: null,
};

const blogsSlice = createSlice({
  name: 'blogs',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlogs.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBlogs.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.blogs = action.payload.blogs;
        state.totalBlogs = action.payload.total_blogs;
        state.totalMagazines = action.payload.total_magazines;
        state.error = null;
      })
      .addCase(fetchBlogs.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(deleteBlog.fulfilled, (state, action) => {
        state.blogs = state.blogs.filter(blog => blog.blog_id !== action.payload);
        state.totalBlogs -= 1;
      });
  },
});

export default blogsSlice.reducer;
