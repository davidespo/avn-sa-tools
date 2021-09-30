import React, { useEffect } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { Link } from 'react-router-dom';

const InsightCard = ({ title, value, loading = false, path }) => {
  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        <p className="card-text text-center display-1">{value}</p>
        {!!path && (
          <Link className="btn btn-primary" to={path}>
            {loading ? 'Loading...' : 'View All'}
          </Link>
        )}
      </div>
    </div>
  );
};

const InsightsHomePage = () => {
  const { user, projects, tickets } = useSelector((state) => ({
    user: state.settings.apiUser,
    projects: state.projects.list,
    tickets: state.tickets,
  }));
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch.tickets.fetchAllTickets();
  }, []);
  return (
    <div className="mt-3">
      <p className="lead">
        {user.name} ({user.email})
      </p>
      <div className="row">
        <div className="col-4">
          <InsightCard
            title="Projects"
            value={projects.length}
            path="/insights/data/projects"
          />
        </div>
        <div className="col-4">
          <InsightCard
            title="Support Tickets"
            loading={tickets.loading}
            value={tickets.list.length}
            path="/insights/data/tickets"
          />
        </div>
      </div>
    </div>
  );
};

export default InsightsHomePage;
