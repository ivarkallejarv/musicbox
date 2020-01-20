import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'

import './App.scss'

const Tuner = lazy(() => import('./components/Tuner/Tuner'))
const Piano = lazy(() => import('./components/Piano/Piano'))

export const Routes = {
  Piano: '/',
  Tuner: '/tuner',
}

export const App: React.FC = () => (
  <main role="main">
    <ul>
      {Object.entries(Routes).map(([key, value], index) => (
        <li key={`nav-link-${index}`}>
          <a href={value}>{key}</a>
        </li>
      ))}
    </ul>

    <h1 className="title">Musicbox</h1>

    <Suspense fallback={null}>
      <Router>
        <Switch>
          <Route path={Routes.Tuner} component={Tuner} />
          <Route path={Routes.Piano} component={Piano} />
        </Switch>
      </Router>
    </Suspense>
  </main>
)
