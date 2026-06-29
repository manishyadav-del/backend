import { SET_AUTH, EDIT_USER, LOGOUT } from "../actions/action";

// Define the shape of your Auth state
export interface AuthState {
  isAuthenticated: boolean;
  userId: string | number | null;
  name: string;
  username: string;
  role: string;
  profile: string;
  profession: string;
  email: string;
  bio: string;
  error: string;
  user: object[]; // TODO: Replace 'object' with a specific user type if available
}

const initialState: AuthState = {
  isAuthenticated: false,
  userId: null,
  name: '',
  username: '',
  role: '',
  profile: '',
  profession: '',
  email: '',
  bio: '',
  error: '',
  user: [],
};

// Define a generic action type
interface Action {
  type: string;
  payload?: Partial<AuthState>;
}

const authReducer = (state: AuthState = initialState, action: Action): AuthState => {
  switch (action.type) {
    case EDIT_USER:
      return {
        ...state,
        user: Array.isArray(action.payload) ? action.payload : [],
      };

    case SET_AUTH:
      return {
        ...state,
        isAuthenticated: action.payload?.isAuthenticated ?? state.isAuthenticated,
        userId: action.payload?.userId ?? state.userId,
        name: action.payload?.name ?? state.name,
        profile: action.payload?.profile ?? state.profile,
        username: action.payload?.username ?? state.username,
        profession: action.payload?.profession ?? state.profession,
        email: action.payload?.email ?? state.email,
        bio: action.payload?.bio ?? state.bio,
      };

    case LOGOUT:
      return initialState;

    default:
      return state;
  }
};

export default authReducer;