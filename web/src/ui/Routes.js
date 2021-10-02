import React from 'react';

import { Link, Route, Switch } from 'react-router-dom';
import CollectionInsights from './insights/CollectionInsights';
import InsightsHomePage from './insights/InsightsHomePage';
import SettingsHomePage from './settings/SettingsHomePage';

const NotFoundPage = () => (
  <div className="p-5 text-center">
    <h1>404 :: Not Found</h1>
    <p className="lead">
      <Link to="/home">Go Home</Link>
    </p>
  </div>
);

const Routes = () => {
  return (
    <Switch>
      <Route exact path="/insights" component={InsightsHomePage} />
      <Route exact path="/insights/:kind" component={CollectionInsights} />

      <Route exact path="/settings" component={SettingsHomePage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
};

export default Routes;
