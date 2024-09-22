import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useDebounce } from 'use-debounce';
import '../styles/list.css';

interface College {
  id: number;
  name: string;
}

interface Registration {
  id: number;
  name: string;
  designation: string;
  college?: College | null;
  phone: string;
  email: string;
  reason: string;
  photoUrl: string;
}

const PAGE_SIZE = 10; // Number of registrations per page

const List: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300); // Debounce the search query

  useEffect(() => {
    const fetchRegistrations = async () => {
      setLoading(true);
      try {
        const response = await axios.get<Registration[]>(`/api/registrations?page=${currentPage}&limit=${PAGE_SIZE}&search=${debouncedSearchQuery}`);
        setRegistrations(response.data);
      } catch (err) {
        console.error('Error fetching registrations:', err);
        setError('Failed to load registrations');
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [currentPage, debouncedSearchQuery]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1); // Reset to the first page on new search
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <div className="controls">
        <input
          type="text"
          placeholder="Search by name"
          value={searchQuery}
          onChange={handleSearch}
          className="search-bar"
        />
        <button onClick={() => setViewType('grid')} className={viewType === 'grid' ? 'active' : ''}>
          Grid View
        </button>
        <button onClick={() => setViewType('list')} className={viewType === 'list' ? 'active' : ''}>
          List View
        </button>
      </div>

      {viewType === 'grid' ? (
        <div className="registration-list grid">
          {registrations.map((registration) => (
            <div className="registration-card" key={registration.id}>
              {registration.photoUrl ? (
                <img
                  src={registration.photoUrl}
                  alt={`${registration.name}'s photo`}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'path/to/placeholder-image.png'; // Placeholder
                  }}
                />
              ) : (
                <div>No image available</div>
              )}
              <h2>{registration.name}</h2>
              <p><strong>Designation:</strong> {registration.designation}</p>
              <p><strong>College:</strong> {registration.college ? registration.college.name : 'N/A'}</p>
              <p><strong>Email:</strong> {registration.email}</p>
              <p><strong>Phone:</strong> {registration.phone}</p>
              <p><strong>Reason:</strong> {registration.reason}</p>
            </div>
          ))}
        </div>
      ) : (
        <table className="registration-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>College Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Event ID</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((registration) => (
              <tr key={registration.id}>
                <td>
                  {registration.photoUrl ? (
                    <img
                      src={registration.photoUrl}
                      alt={`${registration.name}'s photo`}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'path/to/placeholder-image.png'; // Placeholder
                      }}
                    />
                  ) : (
                    'No image'
                  )}
                </td>
                <td>{registration.name}</td>
                <td>{registration.college ? registration.college.name : 'N/A'}</td>
                <td>{registration.email}</td>
                <td>{registration.phone}</td>
                <td>{registration.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination Controls */}
      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        >
          Previous
        </button>
        <span>Page {currentPage}</span>
        <button
          disabled={registrations.length < PAGE_SIZE}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default List;
