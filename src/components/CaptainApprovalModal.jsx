import React, { useEffect, useState } from 'react';

export default function CaptainApprovalModal({ ws, request }) {
  // request: { id, team_id, challenge_id, hint_id, requested_by, expires_at, requested_by_name, challenge_title }
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((new Date(request.expires_at) - new Date())/1000)));
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev-1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const approve = async () => {
    await fetch(`/api/v1/hint-requests/${request.id}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'
      }
    });
    ws.send(JSON.stringify({ type: 'hint:approved', request_id: request.id }));
  };

  const reject = async () => {
    await fetch(`/api/v1/hint-requests/${request.id}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'
      }
    });
    ws.send(JSON.stringify({ type: 'hint:rejected', request_id: request.id }));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h3 className="text-lg font-semibold mb-4">Hint Request</h3>
        <p className="mb-2">
          User <strong>{request.requested_by_name}</strong> requested Hint {request.hint_id} for Challenge <strong>{request.challenge_title}</strong>
        </p>
        <p className="mb-4 text-sm text-gray-600">
          Expires in: <strong>{timeLeft}s</strong>
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={approve}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={reject}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
