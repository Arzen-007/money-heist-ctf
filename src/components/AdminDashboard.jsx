import React, { useState, useEffect } from 'react';
import {
	Users,
	Shield,
	BarChart3,
	Settings,
	Flag,
	MessageSquare,
	TrendingUp,
	AlertTriangle,
	CheckCircle,
	XCircle,
	Eye,
	Ban,
	UserCheck,
	MessageCircle,
	Activity,
	Database,
	Server,
	Clock,
	Loader2
} from 'lucide-react';
import { api } from '../utils/api.js';

const AdminDashboard = () => {
	const [activeTab, setActiveTab] = useState('overview');
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// Load users data when users tab is active
	useEffect(() => {
		if (activeTab === 'users') {
			loadUsers();
		}
	}, [activeTab]);

	const loadUsers = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await api.getUsers({});
			setUsers(response);
		} catch (err) {
			setError('Failed to load users');
			console.error('Error loading users:', err);
		} finally {
			setLoading(false);
		}
	};

	const handleBlockUser = async (userId) => {
		try {
			await api.blockUser(userId);
			loadUsers(); // Refresh the list
		} catch (err) {
			setError('Failed to block user');
			console.error('Error blocking user:', err);
		}
	};

	const handleUnblockUser = async (userId) => {
		try {
			await api.unblockUser(userId);
			loadUsers(); // Refresh the list
		} catch (err) {
			setError('Failed to unblock user');
			console.error('Error unblocking user:', err);
		}
	};

	const handleDeleteUser = async (userId) => {
		if (window.confirm('Are you sure you want to delete this user?')) {
			try {
				await api.deleteUser(userId);
				loadUsers(); // Refresh the list
			} catch (err) {
				setError('Failed to delete user');
				console.error('Error deleting user:', err);
			}
		}
	};

	const tabs = [
		{ id: 'overview', label: 'Overview', icon: <BarChart3 className="w-5 h-5" /> },
		{ id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
		{ id: 'challenges', label: 'Challenges', icon: <Flag className="w-5 h-5" /> },
		{ id: 'teams', label: 'Teams', icon: <Shield className="w-5 h-5" /> },
		{ id: 'messages', label: 'Messages', icon: <MessageSquare className="w-5 h-5" /> },
		{ id: 'system', label: 'System', icon: <Settings className="w-5 h-5" /> }
	];

	const UsersTab = () => (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h3 className="text-2xl font-bold text-white">User Management</h3>
				<button
					onClick={loadUsers}
					className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
					style={{backgroundColor: 'var(--theme-primary)', color: 'white'}}
				>
					<Activity className="w-4 h-4" />
					Refresh
				</button>
			</div>

			{error && (
				<div className="bg-red-600/20 border border-red-600/30 rounded-lg p-4">
					<p className="text-red-400">{error}</p>
				</div>
			)}

			<div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
				<div className="p-4 border-b border-white/10">
					<input
						type="text"
						placeholder="Search users..."
						className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-white/20"
					/>
				</div>

				{loading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="w-8 h-8 animate-spin text-white" />
						<span className="ml-2 text-white">Loading users...</span>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-white/5">
								<tr>
									<th className="px-4 py-3 text-left text-sm font-medium text-gray-300">User</th>
									<th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Role</th>
									<th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Status</th>
									<th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Points</th>
									<th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Team</th>
									<th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Actions</th>
								</tr>
							</thead>
							<tbody>
								{users.map((user) => (
									<tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
										<td className="px-4 py-3">
											<div>
												<div className="text-white font-medium">{user.username}</div>
												<div className="text-gray-400 text-sm">{user.email}</div>
											</div>
										</td>
										<td className="px-4 py-3">
											<span className={`px-2 py-1 rounded-full text-xs font-medium ${
												user.role === 'admin' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
											}` }>
												{user.role}
											</span>
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center gap-2">
												<span className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_blocked ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}` }>
													{user.is_blocked ? 'Blocked' : 'Active'}
												</span>
											</div>
										</td>
										<td className="px-4 py-3 text-white font-medium">{user.points?.toLocaleString() || 0}</td>
										<td className="px-4 py-3 text-gray-400">{user.team?.name || 'No Team'}</td>
										<td className="px-4 py-3">
											<div className="flex items-center gap-2">
												<button className="p-1 text-gray-400 hover:text-white transition-colors">
													<Eye className="w-4 h-4" />
												</button>
												{user.is_blocked ? (
													<button
														onClick={() => handleUnblockUser(user.id)}
														className="p-1 text-gray-400 hover:text-green-400 transition-colors"
														title="Unblock user"
													>
														<UserCheck className="w-4 h-4" />
													</button>
												) : (
													<button
														onClick={() => handleBlockUser(user.id)}
														className="p-1 text-gray-400 hover:text-red-400 transition-colors"
														title="Block user"
													>
														<Ban className="w-4 h-4" />
													</button>
												)}
												<button
													onClick={() => handleDeleteUser(user.id)}
													className="p-1 text-gray-400 hover:text-red-400 transition-colors"
													title="Delete user"
												>
													<XCircle className="w-4 h-4" />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);

	return (
		<div className="min-h-screen pt-24 pb-12 px-4">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="orbitron text-4xl font-bold mb-2" style={{color: 'var(--theme-primary)'}}>
						Admin Dashboard
					</h1>
					<p className="text-gray-400">Manage users, challenges, and monitor system health</p>
				</div>

				{/* Tab Navigation */}
				<div className="flex flex-wrap gap-2 mb-8">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
								activeTab === tab.id
									? 'text-white'
									: 'text-gray-400 hover:text-white'
							}`}
							style={{
								backgroundColor: activeTab === tab.id ? 'var(--theme-primary)' : 'rgba(255,255,255,0.05)'
							}}
						>
							{tab.icon}
							{tab.label}
						</button>
					))}
				</div>

				{/* Tab Content */}
				{activeTab === 'overview' && (
					<div className="text-center py-12">
						<h3 className="text-2xl font-bold text-white mb-4">Overview Dashboard</h3>
						<p className="text-gray-400">Real-time statistics and activity monitoring coming soon...</p>
					</div>
				)}
				{activeTab === 'users' && <UsersTab />}
				{activeTab === 'challenges' && (
					<div className="text-center py-12">
						<h3 className="text-2xl font-bold text-white mb-4">Challenge Management</h3>
						<p className="text-gray-400">Challenge management interface coming soon...</p>
					</div>
				)}
				{activeTab === 'teams' && (
					<div className="text-center py-12">
						<h3 className="text-2xl font-bold text-white mb-4">Teams Management</h3>
						<p className="text-gray-400">Teams management interface coming soon...</p>
					</div>
				)}
				{activeTab === 'messages' && (
					<div className="text-center py-12">
						<h3 className="text-2xl font-bold text-white mb-4">Messages Management</h3>
						<p className="text-gray-400">Messages management interface coming soon...</p>
					</div>
				)}
				{activeTab === 'system' && (
					<div className="text-center py-12">
						<h3 className="text-2xl font-bold text-white mb-4">System Monitoring</h3>
						<p className="text-gray-400">System monitoring interface coming soon...</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default AdminDashboard;
