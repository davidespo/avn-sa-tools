import React, { useEffect } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { Link } from 'react-router-dom';

const InsightGroup = ({ items }) => (
  <ul className="list-group">
    {items.map(({ text, value }) => (
      <li className="list-group-item d-flex justify-content-between align-items-center">
        {text}
        <span className="badge bg-primary rounded-pill">{value}</span>
      </li>
    ))}
  </ul>
);

const Progress = ({ value }) => {
  return (
    <div class="progress">
      <div
        class="progress-bar progress-bar-striped progress-bar-animated"
        role="progressbar"
        style={{ width: `${Math.trunc(value)}%` }}
      ></div>
    </div>
  );
};

const InsightCard = ({ title, value, loading = false, progress, path }) => {
  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        <p className="card-text text-center display-1">{value}</p>
        <div className="card-text mb-4">
          <InsightGroup
            items={[
              { text: 'Empty', value: 0 },
              { text: 'No Tech Email', value: 3 },
            ]}
          />
        </div>
        {loading ? (
          <Progress value={progress} />
        ) : !path ? (
          ''
        ) : (
          <Link className="btn btn-primary" to={path}>
            View All
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
  console.log({ user, projects, tickets });
  // const dispatch = useDispatch();
  // useEffect(() => {
  //   dispatch.tickets.fetchAllTickets();
  //   dispatch.projects.fetchProjectDetails();
  // }, []);
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
          {/* <InsightCard
            title="Support Tickets"
            loading={tickets.loading}
            progress={tickets.progress}
            value={tickets.list.length}
            path="/insights/data/tickets"
          /> */}
        </div>
      </div>
    </div>
  );
};

export default InsightsHomePage;
