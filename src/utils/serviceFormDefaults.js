export const DEFAULT_SERVICE_FORMS = {
    'Crypto Token Creation': [
        {
            title: 'Blockchain & Basics',
            fields: [
                { name: 'blockchain', label: 'Blockchain', type: 'select', required: true, options: ['Ethereum', 'BSC', 'Polygon', 'Solana', 'Avalanche', 'Arbitrum', 'Tron', 'Fantom'] },
                { name: 'tokenName', label: 'Token Name', type: 'text', required: true },
                { name: 'tokenSymbol', label: 'Symbol / Ticker', type: 'text', required: true },
                { name: 'totalSupply', label: 'Total Supply', type: 'number', required: true },
                { name: 'decimals', label: 'Decimals', type: 'number', required: true },
            ],
        },
        {
            title: 'Docs & Website',
            fields: [
                { name: 'whitepaper', label: 'Whitepaper', type: 'select', options: ['Yes', 'No'] },
                { name: 'roadmap', label: 'Roadmap', type: 'select', options: ['Yes', 'No'] },
                { name: 'tokenWebsite', label: 'Token Website', type: 'select', options: ['Yes', 'No'] },
            ],
        },
        {
            title: 'Distribution & Apps',
            fields: [
                { name: 'airdrop', label: 'Airdrop', type: 'select', options: ['Yes', 'No'] },
                { name: 'miningApp', label: 'Mining App', type: 'select', options: ['Yes', 'No'] },
                { name: 'dapp', label: 'DApp', type: 'select', options: ['Yes', 'No'] },
            ],
        },
        {
            title: 'Extra Features',
            fields: [
                { name: 'extraFeatures', label: 'Extra Features', type: 'array', itemType: 'text', itemLabel: 'Feature' },
            ],
        },
    ],
    'Website Development': [
        {
            title: 'Contact Info',
            fields: [
                { name: 'name', label: 'Name', type: 'text', required: true },
                { name: 'phone', label: 'Phone', type: 'tel', required: true },
                { name: 'email', label: 'Email', type: 'email', required: true },
            ],
        },
        {
            title: 'Website Type',
            fields: [
                { name: 'websiteType', label: 'Website Type', type: 'select', required: true, options: ['Business', 'E-commerce', 'Portfolio', 'Blog', 'Education', 'News', 'Non-profit', 'Other'] },
                { name: 'websiteTypeOther', label: 'If Other, specify', type: 'text', placeholder: 'Describe other type' },
            ],
        },
        {
            title: 'Brand & Domain',
            fields: [
                { name: 'websiteName', label: 'Website Name', type: 'text', required: true },
                { name: 'domainRequired', label: 'Domain Required?', type: 'select', required: true, options: ['Yes', 'No'] },
                { name: 'domainName', label: 'Domain Name (desired or existing)', type: 'text' },
            ],
        },
        {
            title: 'Purpose',
            fields: [
                { name: 'websitePurpose', label: 'Website Purpose', type: 'textarea' },
            ],
        },
        {
            title: 'Budget & Timeline',
            fields: [
                { name: 'budgetRange', label: 'Budget Range', type: 'select', required: true, options: ['100$-500$', '500$-1000$', '1000$-5000$'] },
                { name: 'desiredTimeline', label: 'Desired Timeline', type: 'select', required: true, options: ['3–5 days', '5–8 days', '8–12 days', '2–4 weeks'] },
            ],
        },
        {
            title: 'Contact & Extras',
            fields: [
                { name: 'contactEmail', label: 'Contact Email', type: 'text', required: true },
                { name: 'extraRequirements', label: 'Extra Requirements', type: 'array', itemType: 'text', itemLabel: 'Feature' },
                { name: 'numberOfPages', label: 'Number of Pages', type: 'select', options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Other'] },
                { name: 'numberOfPagesOther', label: 'If Other, specify', type: 'text' },
            ],
        },
    ],
    'Chatbot Development': [
        {
            title: 'Platform & Use Case',
            fields: [
                { name: 'platform', label: 'Platform', type: 'select', required: true, options: ['Website', 'Telegram', 'WhatsApp', 'Instagram'] },
                { name: 'useCase', label: 'Use Case', type: 'select', required: true, options: ['Customer Support', 'Sales', 'Lead Generation', 'Custom'] },
            ],
        },
        {
            title: 'Scale & AI',
            fields: [
                { name: 'usersExpected', label: 'Number of Users Expected', type: 'number', required: true },
                { name: 'aiNlpIntegration', label: 'AI/NLP Integration', type: 'select', options: ['Yes', 'No'] },
            ],
        },
        {
            title: 'Integrations & Commands',
            fields: [
                { name: 'integrationCrmDb', label: 'Integration with CRM/Database', type: 'select', options: ['Yes', 'No'] },
                { name: 'customCommands', label: 'Custom Commands', type: 'array', itemType: 'text', itemLabel: 'Command' },
            ],
        },
        {
            title: 'Testing Duration',
            fields: [
                { name: 'testingDuration', label: 'Testing Duration', type: 'select', required: true, options: ['1 Month', '3 Months', '6 Months'] },
            ],
        },
        {
            title: 'Extra Requirements',
            fields: [
                { name: 'extraRequirements', label: 'Extra Requirements', type: 'array', itemType: 'text', itemLabel: 'Requirement' },
            ],
        },
    ],
    'MLM Plan Development': [
        {
            title: 'Plan & Levels',
            fields: [
                { name: 'mlmType', label: 'MLM Type', type: 'select', required: true, options: ['Binary', 'Matrix', 'Unilevel', 'Generation'] },
                { name: 'numberOfLevels', label: 'Number of Levels', type: 'number', required: true },
            ],
        },
        {
            title: 'Payments',
            fields: [
                { name: 'eWalletRequired', label: 'E-Wallet Required?', type: 'select', options: ['Yes', 'No'] },
                { name: 'autoPayout', label: 'Auto Payout', type: 'select', options: ['Yes', 'No'] },
            ],
        },
        {
            title: 'Logic & Users',
            fields: [
                { name: 'customPlanLogic', label: 'Custom Plan Logic', type: 'textarea' },
                { name: 'expectedUsers', label: 'Expected Users', type: 'number' },
            ],
        },
        {
            title: 'Customization',
            fields: [
                { name: 'dashboardCustomization', label: 'Dashboard Customization', type: 'select', options: ['Yes', 'No'] },
                { name: 'mobileAppRequired', label: 'Mobile App Required?', type: 'select', options: ['Yes', 'No'] },
            ],
        },
        {
            title: 'Deadline & Notes',
            fields: [
                { name: 'deadline', label: 'Deadline', type: 'text', placeholder: 'YYYY-MM-DD or text' },
                { name: 'notes', label: 'Notes', type: 'array', itemType: 'text', itemLabel: 'Note' },
            ],
        },
    ],
    'Mobile App Development': [
        {
            title: 'Platform & Category',
            fields: [
                { name: 'platform', label: 'Platform', type: 'select', required: true, options: ['Android', 'iOS', 'Both'] },
                { name: 'category', label: 'Category', type: 'select', required: true, options: ['Business', 'E-commerce', 'Education', 'Finance', 'Custom'] },
            ],
        },
        {
            title: 'Scope',
            fields: [
                { name: 'numberOfScreens', label: 'Number of Screens', type: 'number', required: true },
                { name: 'apiAvailable', label: 'API available?', type: 'select', options: ['Yes', 'No'] },
            ],
        },
        {
            title: 'Design & Backend',
            fields: [
                { name: 'uiUxReference', label: 'UI/UX Reference', type: 'textarea' },
                { name: 'backendRequired', label: 'Backend Required?', type: 'select', options: ['Yes', 'No'] },
            ],
        },
        {
            title: 'Payments & Launch',
            fields: [
                { name: 'paymentGateway', label: 'Payment Gateway Integration?', type: 'select', options: ['Yes', 'No'] },
                { name: 'launchDeadline', label: 'Launch Deadline', type: 'text', placeholder: 'YYYY-MM-DD or text' },
                { name: 'uploadToStore', label: 'Upload App to Store?', type: 'select', options: ['Yes', 'No'] },
            ],
        },
        {
            title: 'Extra Requirements',
            fields: [
                { name: 'extraRequirements', label: 'Extra Requirements', type: 'array', itemType: 'text', itemLabel: 'Requirement' },
            ],
        },
    ],
    'Business Automation': [
        {
            title: 'Process & Platform',
            fields: [
                { name: 'processToAutomate', label: 'Process to Automate', type: 'text', required: true },
                { name: 'currentPlatform', label: 'Current Platform', type: 'text' },
            ],
        },
        {
            title: 'Scale & Integrations',
            fields: [
                { name: 'usersPerMonth', label: 'Users per Month', type: 'number' },
                { name: 'integrationNeeded', label: 'Integration Needed', type: 'select', options: ['CRM', 'ERP', 'Excel', 'Web App', 'API'] },
            ],
        },
        {
            title: 'Automation Type & Dashboard',
            fields: [
                { name: 'automationType', label: 'Automation Type', type: 'select', options: ['Workflow', 'Data', 'Marketing', 'Custom'] },
                { name: 'dashboardRequired', label: 'Dashboard Required?', type: 'select', options: ['Yes', 'No'] },
            ],
        },
        {
            title: 'Alerts & Timeline',
            fields: [
                { name: 'realTimeAlerts', label: 'Real-Time Alerts?', type: 'select', options: ['Yes', 'No'] },
                { name: 'deadline', label: 'Deadline', type: 'text', placeholder: 'YYYY-MM-DD or text' },
                { name: 'testingDuration', label: 'Testing Duration', type: 'select', options: ['1 Month', '3 Months'] },
            ],
        },
        {
            title: 'Notes',
            fields: [
                { name: 'notes', label: 'Notes', type: 'array', itemType: 'text', itemLabel: 'Note' },
            ],
        },
    ],
    'Telegram Bot': [
        {
            title: 'Purpose & Commands',
            fields: [
                { name: 'botPurpose', label: 'Bot Purpose', type: 'select', required: true, options: ['Community', 'Trading', 'Signal', 'Utility'] },
                { name: 'customCommands', label: 'Custom Commands', type: 'array', itemType: 'text', itemLabel: 'Command' },
            ],
        },
        {
            title: 'Data & Channels',
            fields: [
                { name: 'databaseIntegration', label: 'Database Integration?', type: 'select', options: ['Yes', 'No'] },
                { name: 'channelOrGroup', label: 'Channel or Group', type: 'select', options: ['Channel', 'Group', 'Both'] },
            ],
        },
        {
            title: 'Admin & Replies',
            fields: [
                { name: 'adminPanelRequired', label: 'Admin Panel Required?', type: 'select', options: ['Yes', 'No'] },
                { name: 'autoReply', label: 'Auto-Reply?', type: 'select', options: ['Yes', 'No'] },
            ],
        },
        {
            title: 'Payments & Hosting',
            fields: [
                { name: 'paymentIntegration', label: 'Payment Integration?', type: 'select', options: ['Yes', 'No'] },
                { name: 'hosting', label: 'Hosting', type: 'select', options: ['Cloud', 'VPS', 'Self'] },
                { name: 'launchDeadline', label: 'Launch Deadline', type: 'text', placeholder: 'YYYY-MM-DD or text' },
            ],
        },
        {
            title: 'Extra Notes',
            fields: [
                { name: 'extraNotes', label: 'Extra Notes', type: 'array', itemType: 'text', itemLabel: 'Note' },
            ],
        },
    ],
    'Crypto Audit': [
        {
            title: 'Type & Platform',
            fields: [
                { name: 'auditType', label: 'Audit Type', type: 'select', required: true, options: ['Smart Contract', 'dApp', 'DeFi', 'Token'] },
                { name: 'platform', label: 'Platform', type: 'select', required: true, options: ['Ethereum', 'BSC', 'Polygon', 'Solana'] },
            ],
        },
        {
            title: 'Contracts',
            fields: [
                { name: 'contractAddress', label: 'Contract Address', type: 'text', required: true },
                { name: 'auditDepth', label: 'Audit Depth', type: 'select', options: ['Basic', 'Standard', 'Advanced'] },
            ],
        },
        {
            title: 'Reports & Re-Audit',
            fields: [
                { name: 'detailedPdfReport', label: 'Detailed PDF Report?', type: 'select', options: ['Yes', 'No'] },
                { name: 'reAuditRequired', label: 'Re-Audit Required?', type: 'select', options: ['Yes', 'No'] },
            ],
        },
        {
            title: 'Timeline & Scope',
            fields: [
                { name: 'deadline', label: 'Deadline', type: 'text', placeholder: 'YYYY-MM-DD or text' },
                { name: 'numberOfContracts', label: 'Number of Contracts', type: 'number' },
                { name: 'sourceCodeLink', label: 'Source Code Link', type: 'text' },
            ],
        },
        {
            title: 'Additional Requirements',
            fields: [
                { name: 'additionalRequirements', label: 'Additional Requirements', type: 'array', itemType: 'text', itemLabel: 'Requirement' },
            ],
        },
    ],
};
