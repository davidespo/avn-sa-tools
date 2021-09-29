import React, { useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

const SettingsHomePage = () => {
  const currentKey = useSelector((state) => {
    console.log(state);
    return state.settings.apikey || '';
  });
  const [apikey, setApikey] = useState(currentKey);
  const dispatch = useDispatch();
  const persistApiKey = () => dispatch.settings.setApiKey();
  return (
    <div>
      <h1>Settings</h1>
      <div className="form-group">
        <label>Aiven Api Key</label>
        <input
          type="text"
          className="form-control"
          value={apikey}
          onChange={(e) => setApikey(e.target.value)}
        />
      </div>
      <div>
        <button
          className="btn btn-primary"
          enabled={(apikey && apikey !== currentKey).toString()}
          onClick={persistApiKey}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default SettingsHomePage;
