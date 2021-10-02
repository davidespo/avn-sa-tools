import React from 'react';
import _ from 'lodash';

import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

// https://www.npmjs.com/package/react-bs-datatable
import Datatable from 'react-bs-datatable';

const h = (title, prop, filterable, sortable) => ({
  title,
  prop,
  filterable,
  sortable,
});
const HEADERS = {
  // TODO: configurable
  tickets: [
    h('ID', 'ticket_id', true),
    h('Title', 'title', true),
    h('State', 'state', true, true),
    h('Severity', 'severity', true, true),
    h('Project', 'project_name', true),
    h('Service', 'service_name', true),
    h('Created At', 'create_time', false, true),
  ],
};

const CollectionInsights = () => {
  const { kind } = useParams();
  const data = useSelector((state) => state.reports[kind]);
  const headers = HEADERS[kind];
  return (
    <div>
      <h1>{_.startCase(kind)}</h1>
      <Datatable tableHeaders={headers} tableBody={data.list} />
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default CollectionInsights;
