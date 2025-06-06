import React, { useState, useEffect } from 'react';
import { fetchDrafts, deleteDraft } from '../api/api';
import { useNavigate } from 'react-router-dom';
import '../styles/Draft.css';

const Draft = ({user, setProductExactName}) => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'draft_id', direction: 'ascending' });

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const data = await fetchDrafts();
      setDrafts(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch drafts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const handleContinue = (draftId, full_summary, user) => {
    const data = JSON.parse(full_summary);
    const selectedPackage = data[0].title;
    setProductExactName(selectedPackage);
    navigate('/general', {
      state: {
        id: draftId,
        item: data,
        isDraft: true,
        selectedPackages: data[0].selectedpackages,
        editTitle: selectedPackage, 
        user: user,
        currentStep: data[0].currentStep || 0
      }
    });
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleDelete = async (draftId) => {
    if (window.confirm('Are you sure you want to delete this draft?')) {
      try {
        const now = formatDate(new Date().toISOString());
        await deleteDraft(draftId, user, now);
        loadDrafts();
        alert('Draft deleted successfully');
      } catch (error) {
        alert('Failed to delete draft');
        console.error(error);
      }
    }
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedDrafts = React.useMemo(() => {
    let sortableDrafts = [...drafts];
    if (sortConfig.key) {
      sortableDrafts.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableDrafts;
  }, [drafts, sortConfig]);

  const filteredDrafts = sortedDrafts.filter(draft =>
    draft.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    draft.draft_id.toString().includes(searchTerm)
  );

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Add this function before the return statement
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `(${Math.floor(diffInSeconds / 60)}M ago)`;
    if (diffInSeconds < 86400) return `(${Math.floor(diffInSeconds / 3600)}H ago)`;
    return `(${Math.floor(diffInSeconds / 86400)}D ago)`;
  };

  return (
    <div className="draft-container">
      <div className="draft-header">
        <h2>Saved Drafts</h2>
        <div className="draft-header-actions">
          <input
            type="text"
            placeholder="Search by ID or User..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="draft-search-input"
          />
          <button onClick={loadDrafts} className="draft-refresh-button">
            Refresh
          </button>
        </div>
      </div>

      <div className="draft-table-container">
        <table className="draft-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('draft_id')}>
                Policy Draft ID {getSortIndicator('draft_id')}
              </th>
              <th onClick={() => requestSort('user')}>
                Agent/User {getSortIndicator('user')}
              </th>
              <th onClick={() => requestSort('created_time')}>
                Last Modified {getSortIndicator('created_time')}
              </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDrafts.map((draft) => {
              const draftData = JSON.parse(draft.full_summary)[0];
              return (
                <tr key={draft.draft_id}>
                  <td>
                    <div className="draft-id">
                      <span className="draft-number">#{draft.draft_id}</span>
                      <span className="draft-type">{draftData.title}</span>
                    </div>
                  </td>
                  <td>
                    <div className="user-info">
                      <span className="user-name">{draft.user}</span>
                    </div>
                  </td>
                  <td>
                    <div className="time-info">
                      <span className="date">{formatDate(draft.created_time)} </span>
                      <span className="time-ago">
                        {getTimeAgo(draft.created_time)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="draft-status">In Progress</span>
                  </td>
                  <td className="actions-cell">
                    <button
                      onClick={() => handleContinue(draft.draft_id, draft.full_summary, draft.user)}
                      className="continue-button"
                    >
                      Continue Draft
                    </button>
                    <button
                      onClick={() => handleDelete(draft.draft_id)}
                      className="delete-button"
                    >
                      Delete Draft
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredDrafts.length === 0 && (
        <div className="no-drafts">
          <p>No drafts found</p>
        </div>
      )}
    </div>
  );
};

export default Draft;