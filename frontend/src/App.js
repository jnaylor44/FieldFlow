// // import React from 'react';
// // import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// // import Login from './pages/Login';
// // import Signup from './pages/Signup';
// // import Dashboard from './pages/Dashboard';
// // import WorkerDashboard from './pages/WorkerDashboard';
// // import PrivateRoute from './components/auth/PrivateRoute';

// // function App() {
// //   const isAuthenticated = !!localStorage.getItem('token');

// //   return (
// //     <Router>
// //       <Routes>
// //         {/* Public routes */}
// //         <Route 
// //           path="/login" 
// //           element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
// //         />
// //         <Route 
// //           path="/signup" 
// //           element={isAuthenticated ? <Navigate to="/dashboard" /> : <Signup />} 
// //         />
        
// //         {/* Protected routes with role checks */}
// //         <Route 
// //           path="/dashboard" 
// //           element={
// //             <PrivateRoute requiredRoles={['owner', 'admin']}>
// //               <Dashboard />
// //             </PrivateRoute>
// //           } 
// //         />
        
// //         <Route 
// //           path="/worker-dashboard" 
// //           element={
// //             <PrivateRoute requiredRoles={['worker']}>
// //               <WorkerDashboard />
// //             </PrivateRoute>
// //           } 
// //         />
        
// //         {/* Root redirect - if authenticated, this will be handled by PrivateRoute */}
// //         <Route 
// //           path="/" 
// //           element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
// //         />
        
// //         {/* Catch all route */}
// //         <Route path="*" element={<Navigate to="/" />} />
// //       </Routes>
// //     </Router>
// //   );
// // }

// // export default App;
// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import Login from './pages/Login';
// import Signup from './pages/Signup';
// import Dashboard from './pages/Dashboard';
// import WorkerDashboard from './pages/WorkerDashboard';
// import JobDetail from './pages/JobDetail'; 
// import PrivateRoute from './components/auth/PrivateRoute';
// import ReportTemplatesPage from './pages/ReportTemplatesPage';

// function App() {
//   const isAuthenticated = !!localStorage.getItem('token');

//   return (
//     <Router>
//       <Routes>
//         {/* Public routes */}
//         <Route 
//           path="/login" 
//           element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
//         />
//         <Route 
//           path="/signup" 
//           element={isAuthenticated ? <Navigate to="/dashboard" /> : <Signup />} 
//         />
        
//         {/* Protected routes with role checks */}
//         <Route 
//           path="/dashboard" 
//           element={
//             <PrivateRoute requiredRoles={['owner', 'admin']}>
//               <Dashboard />
//             </PrivateRoute>
//           } 
//         />
        
//         {/* New route for job details */}
//         <Route 
//           path="/jobs/:jobId" 
//           element={
//             <PrivateRoute requiredRoles={['owner', 'admin']}>
//               <JobDetail />
//             </PrivateRoute>
//           } 
//         />
        
//         <Route 
//           path="/worker-dashboard" 
//           element={
//             <PrivateRoute requiredRoles={['worker']}>
//               <WorkerDashboard />
//             </PrivateRoute>
//           } 
//         />
//         <Route 
//           path="/reports/templates" 
//           element={
//             <PrivateRoute requiredRoles={['owner', 'admin']}>
//               <ReportTemplatesPage />
//             </PrivateRoute>
//           } 
//         />
        
//         {/* Root redirect */}
//         <Route 
//           path="/" 
//           element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
//         />
        
//         {/* Catch all route */}
//         <Route path="*" element={<Navigate to="/" />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import JobDetail from './pages/JobDetail'; 
import PrivateRoute from './components/auth/PrivateRoute';
import ReportTemplatesPage from './pages/ReportTemplatesPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reports/templates" element={<ReportTemplatesPage />} />
        <Route path="/jobs" element={<JobDetail />} />

        {/* Protected Admin/Owner routes */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute requiredRoles={['owner', 'admin']}>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/jobs/:jobId" 
          element={
            <PrivateRoute requiredRoles={['owner', 'admin']}>
              <JobDetail />
            </PrivateRoute>
          } 
        />
         <Route 
          path="/reports/templates" 
          element={
            <PrivateRoute requiredRoles={['owner', 'admin']}>
              <ReportTemplatesPage />
            </PrivateRoute>
          } 
        />
        
        {/* Protected Worker routes */}
        <Route 
          path="/worker-dashboard" 
          element={
            <PrivateRoute requiredRoles={['worker']}>
              <WorkerDashboard />
            </PrivateRoute>
          } 
        />
        
        {/* Root redirect - PrivateRoute will handle logic */}
        <Route 
          path="/" 
          element={<PrivateRoute><Dashboard /></PrivateRoute>} 
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;