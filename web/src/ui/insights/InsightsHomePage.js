import React from 'react';
import _ from 'lodash';

import { useDispatch, useSelector } from 'react-redux';

import { Link } from 'react-router-dom';

/*
{
  "key": "techEmail",
  "text": "Project without tech email",
  "kind": "COUNT",
  "count": 18
},
{
  "key": "account",
  "text": "Account Assignment",
  "kind": "GROUP_BY",
  "counts": {
    "Aiven Enterprise POC Projects": 2,
    "Solutions Architecture": 10,
    "David Corporate": 2,
    "demo-tech1": 3,
    "Engineering": 1,
    "Aiven Demo Account": 1
  }
}
*/

const CountInsightItem = ({ item: { text, count } }) => (
  <li className="list-group-item d-flex justify-content-between align-items-center">
    {text}
    <span className="badge bg-secondary rounded-pill">{count}</span>
  </li>
);

const GroupByInsightItem = ({ item: { text, counts } }) => (
  <li className="list-group-item">
    {text} <br />
    {Object.keys(counts).map((k) => (
      <span className="badge bg-secondary mr-3" key={k}>
        {`${k}: ${counts[k]}`}
      </span>
    ))}
  </li>
);

const InsightItem = ({ item }) => {
  switch (item.kind) {
    case 'COUNT': {
      return <CountInsightItem item={item} />;
    }
    case 'GROUP_BY': {
      return <GroupByInsightItem item={item} />;
    }
    default:
      return <span></span>;
  }
};

const InsightGroup = ({ items }) => (
  <ul className="list-group">
    {items.map((item) => (
      <InsightItem item={item} key={item.key} />
    ))}
  </ul>
);

const Progress = ({ value }) => {
  return (
    <div className="progress">
      <div
        className="progress-bar progress-bar-striped progress-bar-animated bg-success"
        role="progressbar"
        style={{ width: `${Math.trunc(value)}%` }}
      ></div>
    </div>
  );
};

const InsightCard = ({ slug, collection }) => {
  const title = _.startCase(slug);
  const { loading, progress, list, insights } = collection;
  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        <p className="card-text text-center display-1">{list.length}</p>
        <div className="card-text mb-4">
          <InsightGroup items={insights} />
        </div>
        {loading ? (
          <Progress value={progress * 100} />
        ) : (
          <Link className="btn btn-primary" to={`/insights/${slug}`}>
            View All
          </Link>
        )}
      </div>
    </div>
  );
};

const InsightsHomePage = () => {
  const { user, reports } = useSelector((state) => ({
    user: state.settings.apiUser,
    reports: state.reports,
  }));
  const dispatch = useDispatch();
  const runReport = () => dispatch.reports.runFullReport();
  return (
    <div className="mt-3">
      <p className="lead">
        {user.name} ({user.email})
      </p>
      <p>
        <button className="btn btn-success" onClick={runReport}>
          Run Report
        </button>
      </p>
      <div className="row">
        {Object.keys(reports)
          .filter((k) => k !== 'running')
          .map((k) => (
            <div className="col-4 mb-3" key={k}>
              <InsightCard slug={k} collection={reports[k]} />
            </div>
          ))}
      </div>
    </div>
  );
};

export default InsightsHomePage;
