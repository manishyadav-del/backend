
import axios from 'axios';
import { serverUrl } from '@/lib/config';

// ================= Action Types =================
export const SET_AUTH = 'SET_AUTH' as const;
export const POST_CATEGORY = 'POST_CATEGORY' as const;
export const POST_ADDEMPLOYEE = 'POST_ADDEMPLOYEE' as const;
export const GET_CATEGORY = 'GET_CATEGORY' as const;
export const GET_BLOG = 'GET_BLOG' as const;
export const EDIT_USER = 'EDIT_USER' as const;
export const GET_INDIVIDUAL_BLOG = 'GET_INDIVIDUAL_BLOG' as const;
export const EDIT_INDIVIDUAL_BLOG = 'EDIT_INDIVIDUAL_BLOG' as const;

// Async blog fetch action types
export const FETCH_BLOGS_REQUEST = 'FETCH_BLOGS_REQUEST' as const;
export const FETCH_BLOGS_SUCCESS = 'FETCH_BLOGS_SUCCESS' as const;
export const FETCH_BLOGS_FAILURE = 'FETCH_BLOGS_FAILURE' as const;

export const LOGOUT = 'LOGOUT' as const;

// ================= Types =================
export interface AuthPayload {
  isAuthenticated: boolean;
  userId: string;
  name: string;
  profile: string;
  username: string;
  profession: string;
  email: string;
  bio: string;
}

export interface Blog {
  id: string;
  title: string;
  description: string;
  [key: string]: unknown; // extendable for unknown fields
}

// ================= Action Creators =================

// --- Auth ---
export const setAuth = (
  isAuthenticated: boolean,
  userId: string,
  name: string,
  profile: string,
  username: string,
  profession: string,
  email: string,
  bio: string
) => ({
  type: SET_AUTH,
  payload: { isAuthenticated, userId, name, profile, username, profession, email, bio },
});

export const logout = () => ({
  type: LOGOUT,
});

// --- Edit User ---
export const editUserProfile =
  (id: string, updatedData: Record<string, string | Blob>) =>
  async (dispatch: (action: { type: string; payload: unknown }) => void) => {
    try {
      const formData = new FormData();
      for (const key in updatedData) {
        formData.append(key, updatedData[key]);
      }

      const response = await axios.put(`${serverUrl}/user/update-user/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      dispatch({ type: EDIT_USER, payload: response.data });
      alert('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user');
    }
  };

// --- Blog Fetch ---
export const fetchBlogsRequest = () => ({
  type: FETCH_BLOGS_REQUEST,
});

export const fetchBlogsSuccess = (blogs: Blog[]) => ({
  type: FETCH_BLOGS_SUCCESS,
  payload: blogs,
});

export const fetchBlogsFailure = (error: string) => ({
  type: FETCH_BLOGS_FAILURE,
  payload: error,
});

export const fetchBlogs =
  () => async (dispatch: (action: { type: string; payload?: Blog[] | string }) => void) => {
    dispatch(fetchBlogsRequest());
    try {
      const response = await axios.get(`${serverUrl}/blog/fetchblog`);
      dispatch(fetchBlogsSuccess(response.data));
    } catch {
      dispatch(fetchBlogsFailure('Failed to fetch blogs'));
    }
  };

export { serverUrl };
