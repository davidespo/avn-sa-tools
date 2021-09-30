import React, { useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

const SettingsHomePage = () => {
  const {
    apiKey: currentKey,
    apiUser,
    apiError,
  } = useSelector((state) => {
    return state.settings;
  });
  const [apiKey, setApiKey] = useState(currentKey);
  const dispatch = useDispatch();
  const persistApiKey = () => dispatch.settings.setApiKey(apiKey);
  return (
    <div>
      <h1>Settings</h1>
      <div className="form-group">
        <label>Aiven Api Key</label>
        {!!apiError && (
          <div className="alert alert-danger">
            <p>{apiError}</p>
          </div>
        )}
        {!!apiUser && (
          <div className="alert alert-info">
            <p>{`${apiUser.name} <${apiUser.email}>`}</p>
          </div>
        )}
        <input
          type="text"
          className="form-control"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>
      <div>
        <button
          className="btn btn-primary"
          enabled={(!!apiKey && apiKey !== currentKey).toString()}
          onClick={persistApiKey}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default SettingsHomePage;
