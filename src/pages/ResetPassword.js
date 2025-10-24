import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Button from '../components/Button';
import toast from 'react-hot-toast';
export default function ResetPassword() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { handlePasswordResetLink } = useUser();
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [oobCode, setOobCode] = useState('');
    useEffect(() => {
        const oc = params.get('oobCode') || '';
        setOobCode(oc);
    }, [params]);
    const onSubmit = async () => {
        if (!oobCode)
            return toast.error('Invalid reset link');
        if (newPassword.length < 6)
            return toast.error('Password must be at least 6 characters');
        if (newPassword !== confirm)
            return toast.error('Passwords do not match');
        try {
            await handlePasswordResetLink(oobCode, newPassword);
            toast.success('Password reset successful');
            navigate('/login');
        }
        catch (e) {
            toast.error('Failed to reset password');
        }
    };
    return (_jsxs("div", { className: "max-w-md mx-auto p-6", children: [_jsx("h1", { className: "text-xl font-bold", children: "Reset Password" }), _jsxs("div", { className: "mt-3 grid grid-cols-1 gap-3", children: [_jsx("input", { type: "password", value: newPassword, onChange: (e) => setNewPassword(e.target.value), placeholder: "New password", className: "rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-white" }), _jsx("input", { type: "password", value: confirm, onChange: (e) => setConfirm(e.target.value), placeholder: "Confirm password", className: "rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-white" })] }), _jsx("div", { className: "mt-3", children: _jsx(Button, { onClick: onSubmit, children: "Reset" }) })] }));
}
