import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DEFAULT_FORM_PARTS } from '../constants/feedback';

export function useFeedbackForm() {
    const [formParts, setFormParts] = useState(DEFAULT_FORM_PARTS);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', sex: '', countryCode: '+63', contactNumber: '',
        clientType: 'Internal', officeUnitAddress: '', officeUnitOther: '',
        province: '', city: '', barangay: '',
        children: [{ name: '', age: '', sex: '' }],
        activities: '',
        dateOfUse: new Date().toISOString().split('T')[0],
        comments: '',
        serviceAvailed: '',
    });

    const [flowType, setFlowType] = useState(null); // 'register' | 'evaluate' | null
    const [userCode, setUserCode] = useState('');
    const [codeValidated, setCodeValidated] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [registrationId, setRegistrationId] = useState(null);
    const [currentPart, setCurrentPart] = useState(0);
    const [showCoverPage, setShowCoverPage] = useState(true);
    const [showThankYou, setShowThankYou] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function fetchFormParts() {
            try {
                const { data: partsData } = await supabase.from('form_parts').select('key, sort_order, label').order('sort_order');
                const { data: questionsData } = await supabase.from('questions').select('part, sort_order, key, label, answer_type, options').order('part').order('sort_order');
                if (partsData && questionsData) {
                    const parts = partsData
                        .map(p => ({
                            key: p.key, label: p.label,
                            questions: questionsData.filter(q => q.part === p.key).map(q => ({
                                key: q.key,
                                label: q.label,
                                answerType: q.answer_type || 'emoji',
                                options: q.options || []
                            }))
                        }))
                        .filter(p => p.questions.length > 0);
                    if (parts.length > 0) setFormParts(parts);
                }
            } catch (e) { console.error('Error fetching parts:', e); }
        }
        fetchFormParts();
    }, []);

    const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    const handleChildChange = (index, field, value) => {
        const newChildren = [...formData.children];
        newChildren[index][field] = value;
        handleInputChange('children', newChildren);
    };

    const addChild = () => handleInputChange('children', [...formData.children, { name: '', age: '', sex: '' }]);

    const removeChild = (index) => {
        if (formData.children.length === 1) return;
        const newChildren = [...formData.children];
        newChildren.splice(index, 1);
        handleInputChange('children', newChildren);
    };

    const validateRegistration = () => {
        if (!formData.firstName.trim()) { alert('Please enter your first name'); return false; }
        if (!formData.lastName.trim()) { alert('Please enter your last name'); return false; }
        if (formData.contactNumber.replace(/\D/g, '').length !== 10) { alert('Contact number must be exactly 10 digits.'); return false; }
        if (formData.clientType === 'Internal' && !formData.officeUnitAddress) { alert('Please select your office/unit'); return false; }
        if ((formData.clientType === 'External' || formData.officeUnitAddress === 'Others') && !formData.officeUnitOther.trim()) { alert('Please specify your address'); return false; }
        if (formData.children.some(c => !c.name || !c.age || !c.sex)) { alert('Please fill in all child details.'); return false; }
        if (formData.serviceAvailed === 'Mother and Child Care' && !formData.activities.trim()) { alert('Please enter the activities.'); return false; }
        return true;
    };

    const submitRegistration = async () => {
        if (!validateRegistration()) return;
        setSubmitting(true);
        try {
            let code;
            let isUnique = false;
            while (!isUnique) {
                code = Math.floor(10000 + Math.random() * 90000).toString();
                const { data } = await supabase.from('registrations').select('code').eq('code', code).single();
                if (!data) isUnique = true;
            }
            const row = {
                code,
                first_name: formData.firstName,
                last_name: formData.lastName,
                parent_name: `${formData.firstName} ${formData.lastName}`.trim(),
                sex: formData.sex || null,
                country_code: formData.countryCode || null,
                contact_number: formData.contactNumber,
                client_type: formData.clientType,
                office_unit_address: formData.clientType === 'Internal' ? formData.officeUnitAddress : formData.officeUnitOther,
                office_unit_other: formData.officeUnitAddress === 'Others' || formData.clientType === 'External' ? formData.officeUnitOther : null,
                province: formData.province || null,
                city: formData.city || null,
                barangay: formData.barangay || null,
                children: formData.children,
                date_of_use: formData.dateOfUse,
                service_availed: formData.serviceAvailed || null,
                activities: formData.activities || null,
            };
            const { error } = await supabase.from('registrations').insert([row]);
            if (error) throw error;
            setGeneratedCode(code);
            setShowThankYou(true);
        } catch (e) {
            alert('Could not submit registration.');
        } finally {
            setSubmitting(false);
        }
    };

    const validateUserCode = async () => {
        if (userCode.length !== 5) { alert('Enter a 5-digit code.'); return; }
        setSubmitting(true);
        try {
            const { data, error } = await supabase.from('registrations').select('id').eq('code', userCode).single();
            if (error || !data) throw new Error();
            setRegistrationId(data.id);
            setCodeValidated(true);
            setCurrentPart(1);
        } catch {
            alert('Invalid code.');
        } finally {
            setSubmitting(false);
        }
    };

    const submitEvaluation = async () => {
        const hasAnyRating = (questions) => questions.some(q => formData[q.key] && formData[q.key].trim() !== '');
        for (let i = 0; i < formParts.length; i++) {
            if (!hasAnyRating(formParts[i].questions)) {
                alert(`Please answer all required items in ${formParts[i].label}.`);
                return;
            }
        }
        setSubmitting(true);
        try {
            const answers = {};
            formParts.forEach(part => part.questions.forEach(q => { answers[q.key] = formData[q.key] || null; }));
            const { error } = await supabase.from('evaluations').insert([{
                registration_id: registrationId,
                answers, comments: formData.comments || null
            }]);
            if (error) throw error;
            setShowThankYou(true);
        } catch {
            alert('Could not submit evaluation.');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            firstName: '', lastName: '', sex: '', countryCode: '+63', contactNumber: '',
            clientType: 'Internal', officeUnitAddress: '', officeUnitOther: '',
            province: '', city: '', barangay: '',
            children: [{ name: '', age: '', sex: '' }],
            activities: '',
            dateOfUse: new Date().toISOString().split('T')[0], comments: '', serviceAvailed: ''
        });
        setCurrentPart(0); setFlowType(null); setShowCoverPage(true); setShowThankYou(false); setCodeValidated(false); setUserCode('');
    };

    return {
        formParts,
        formData,
        flowType,
        setFlowType,
        userCode,
        setUserCode,
        codeValidated,
        generatedCode,
        currentPart,
        setCurrentPart,
        showCoverPage,
        setShowCoverPage,
        showThankYou,
        submitting,
        handleInputChange,
        handleChildChange,
        addChild,
        removeChild,
        submitRegistration,
        validateUserCode,
        submitEvaluation,
        resetForm,
        totalParts: formParts.length + 2,
    };
}
