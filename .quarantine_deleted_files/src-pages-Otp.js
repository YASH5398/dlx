import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useI18n } from '../context/I18nContext';
import Button from '../components/Button';
export default function Otp() {
    const { verifyMfa } = useUser();
    const { t } = useI18n();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const onVerify = async () => {
        setError('');
        const ok = await verifyMfa(code);
        if (!ok)
            setError(t('Invalid code'));
    };
    return (_jsxs("div", { className: "max-w-md mx-auto p-6", children: [_jsx("h1", { className: "text-xl font-bold", children: t('otp_title') }), _jsx("p", { className: "text-sm text-gray-300 mt-1", children: t('otp_desc') }), _jsx("input", { value: code, onChange: (e) => setCode(e.target.value), placeholder: "123456", className: "mt-3 w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-white" }), error && _jsx("div", { className: "text-rose-400 text-sm mt-2", children: error }), _jsx("div", { className: "mt-3 flex items-center gap-3", children: _jsx(Button, { onClick: onVerify, children: t('verify_code') }) })] }));
}
