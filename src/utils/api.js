// Basic API client for Money Heist CTF

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

function getAuthToken() {
	return localStorage.getItem('mhctf_token') || '';
}

function setAuthToken(token) {
	if (token) {
		localStorage.setItem('mhctf_token', token);
	} else {
		localStorage.removeItem('mhctf_token');
	}
}

async function request(path, options = {}) {
	const url = `${API_BASE_URL}${path}`;
	const headers = new Headers(options.headers || {});
	headers.set('Accept', 'application/json');
	if (!(options.body instanceof FormData)) {
		headers.set('Content-Type', 'application/json');
	}
	const token = getAuthToken();
	if (token) headers.set('Authorization', `Bearer ${token}`);

	const res = await fetch(url, { ...options, headers, credentials: 'include' });
	if (!res.ok) {
		let errorDetail = 'Request failed';
		try {
			const data = await res.json();
			errorDetail = data?.detail || JSON.stringify(data);
		} catch {}
		throw new Error(`${res.status} ${res.statusText}: ${errorDetail}`);
	}
	if (res.status === 204) return null;
	return res.json();
}

export const api = {
	// Auth
	async login({ username, password }) {
		const body = new URLSearchParams();
		body.set('username', username);
		body.set('password', password);
		const res = await fetch(`${API_BASE_URL}/auth/login`, {
			method: 'POST',
			headers: { 'Accept': 'application/json' },
			body,
			credentials: 'include'
		});
		if (!res.ok) {
			const data = await res.json().catch(() => ({}));
			throw new Error(data?.detail || 'Login failed');
		}
		const data = await res.json();
		setAuthToken(data.access_token);
		return data;
	},
	logout() {
		setAuthToken('');
	},
	async register({ username, email, password }) {
		return request('/auth/register', {
			method: 'POST',
			body: JSON.stringify({ username, email, password })
		});
	},
	async me() {
		return request('/auth/me', { method: 'GET' });
	},

	// Users (admin)
	async getUsers({ skip = 0, limit = 100 } = {}) {
		return request(`/users?skip=${skip}&limit=${limit}`, { method: 'GET' });
	},
	async blockUser(userId) {
		return request(`/users/${userId}/block`, { method: 'POST' });
	},
	async unblockUser(userId) {
		return request(`/users/${userId}/unblock`, { method: 'POST' });
	},
	async deleteUser(userId) {
		return request(`/users/${userId}`, { method: 'DELETE' });
	},

	// Scoreboard
	async getScoreboardIndividuals({ wave, limit = 50 } = {}) {
		const params = new URLSearchParams();
		if (wave) params.set('wave', wave);
		if (limit) params.set('limit', String(limit));
		return request(`/scoreboard/individual?${params.toString()}`, { method: 'GET' });
	},
	async getScoreboardTeams({ wave, limit = 50 } = {}) {
		const params = new URLSearchParams();
		if (wave) params.set('wave', wave);
		if (limit) params.set('limit', String(limit));
		return request(`/scoreboard/teams?${params.toString()}`, { method: 'GET' });
	},
	async getScoreboardStats() {
		return request('/scoreboard/stats', { method: 'GET' });
	},

	// Challenges
	async listChallenges(filters = {}) {
		const params = new URLSearchParams();
		Object.entries(filters).forEach(([k, v]) => {
			if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
		});
		return request(`/challenges?${params.toString()}`, { method: 'GET' });
	},
	async getChallenge(id) {
		return request(`/challenges/${id}`, { method: 'GET' });
	},
	async submitFlag(id, flag) {
		return request(`/challenges/${id}/submit`, { method: 'POST', body: JSON.stringify({ flag }) });
	},

	// Teams
	async listTeams({ skip = 0, limit = 100 } = {}) {
		return request(`/teams?skip=${skip}&limit=${limit}`, { method: 'GET' });
	},
	async getTeam(id) {
		return request(`/teams/${id}`, { method: 'GET' });
	}
};
