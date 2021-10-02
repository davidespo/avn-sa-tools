import React from 'react';
import _ from 'lodash';

import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

const CollectionInsights = () => {
  const { kind } = useParams();
  const data = useSelector((state) => state.reports[kind]);
  return (
    <div>
      <h1>{_.startCase(kind)}</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default CollectionInsights;
