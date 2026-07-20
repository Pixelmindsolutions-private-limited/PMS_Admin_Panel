// App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import Login from './components/views/Login';
import StaffLogin from './components/views/StaffLogin';
import DashboardLayout from './components/views/DashboardLayout';
import Dashboard from './components/views/Dashboard';
import Staff from './components/Employee/Staff';
import AddStaff from './components/Employee/AddStaff';
import Projects from './components/Projects/Projects';
import AddProject from './components/Projects/AddProject';
import AssignedWorks from './components/Tasks/AssignedWorks';
import AddWorksheet from './components/Tasks/AddWorksheet';
import EditStaff from './components/Employee/EditStaff';
import EditProject from './components/Projects/EditProject';
import EditWorksheet from './components/Tasks/EditWorksheet';
import AddAttendance from './components/Attendance/AddAttendance';
import ShowAttendance from './components/Attendance/ShowAttendance';
import CreateInvoice from './components/Invoice/CreateInvoice';
import ShowInvoices from './components/Invoice/ShowInvoices';
import CreatePayslip from './components/Payslips/CreatePayslip';
import ShowPayslips from './components/Payslips/ShowPayslips';
import StaffDetails from './components/Employee/SingleStaff';
import ProjectDetails from './components/Projects/SingleProject';
import AdvancedInvoice from './components/Invoice/AdvaceInvoiceGenerator';
import WorkSessionLive from './components/WorkSession/WorkSessionLive';
import WorkSessionHistory from './components/WorkSession/WorkSessionHistory';
import WorkSessionReports from './components/WorkSession/WorkSessionReports';
import AddClient from './components/clients/AddClient';
import EditClient from './components/clients/EditClient';
import AllClients from './components/clients/AllClients';
import SingleClient from './components/clients/SingleClient';
import AddInstallment from './components/Installments/AddInstallments';
import AddEmployeeAccess from './components/views/EmployeeAccess/AddEmployeeAccess';
import EmployeeAccessList from './components/views/EmployeeAccess/AccessEmployee';
import SingleEmployeeAccess from './components/views/EmployeeAccess/SingleEmployeeAccess';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!sessionStorage.getItem("loginDetails")
  );

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('loginDetails');
    setIsLoggedIn(false);
  };

  return (
    <Routes>
      <Route
        path="/"
        element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />}
      />

      <Route path='/staff-login' element={<StaffLogin onLogin={handleLogin} />}/>

      <Route
        path="/"
        element={<DashboardLayout isLoggedIn={isLoggedIn} onLogout={handleLogout} />}
      >
        <Route path="dashboard" element={<Dashboard />} />

        <Route path="staff" element={<Staff />} />
        <Route path="staff/:id" element={<StaffDetails />} />
        <Route path="staff/edit/:id" element={<EditStaff />} />
        <Route path="add-staff" element={<AddStaff />} />

        <Route path='add-client' element={<AddClient />} />
        <Route path='edit-client/:id' element={<EditClient />} />
        <Route path='allclients' element={<AllClients />} />
        <Route path='client/:id' element={<SingleClient />} />

        <Route path='add-installment' element={<AddInstallment />} />

        <Route path="add-project" element={<AddProject />} />
        <Route path="projects/:id" element={<ProjectDetails />} />
        <Route path="edit-project/:id" element={<EditProject />} />
        <Route path="projects" element={<Projects />} />

        <Route path="assigned-works" element={<AssignedWorks />} />
        <Route path="add-worksheet" element={<AddWorksheet />} />
        <Route path="edit-worksheet/:id" element={<EditWorksheet />} />

        <Route path="add-attendance" element={<AddAttendance />} />
        <Route path="attendance" element={<ShowAttendance />} />

        <Route path="work-session-live" element={<WorkSessionLive />} />
        <Route path="work-session-history" element={<WorkSessionHistory />} />
        <Route path="work-session-reports" element={<WorkSessionReports />} />

        <Route path="create-invoice" element={<CreateInvoice />} />
        <Route path="invoices" element={<ShowInvoices />} />
        <Route path="invoices1" element={<AdvancedInvoice />} />

        <Route path="create-payslip" element={<CreatePayslip />} />
        <Route path="payslips" element={<ShowPayslips />} />

        <Route path="add-employee-access" element={<AddEmployeeAccess />} />
        <Route path="employee-access" element={<EmployeeAccessList />} />
        <Route path="/employee-access/:staffId" element={<SingleEmployeeAccess />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;