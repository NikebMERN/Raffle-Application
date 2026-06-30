import { configureStore, createSlice } from '@reduxjs/toolkit';

const raffleSlice = createSlice({
  name: 'raffle',
  initialState: { active: null, tickets: [], soldCount: 0 },
  reducers: {
    setActiveRaffle: (state, action) => { state.active = action.payload; },
    setSoldCount: (state, action) => { state.soldCount = action.payload; },
    setTickets: (state, action) => { state.tickets = action.payload; },
  },
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], unread: 0 },
  reducers: {
    setNotifications: (state, action) => {
      state.items = action.payload;
      state.unread = action.payload.filter((n) => !n.read).length;
    },
  },
});

export const { setActiveRaffle, setSoldCount, setTickets } = raffleSlice.actions;
export const { setNotifications } = notificationSlice.actions;

export const store = configureStore({
  reducer: {
    raffle: raffleSlice.reducer,
    notifications: notificationSlice.reducer,
  },
});
