import React, { forwardRef } from 'react';
import axios from 'axios';
import styles from '../styles/RegistrationForm.module.css';
import LoadingScreen from './LoadingScreen';
import useForm from '../hooks/useForm';
import BannerSection from '../BannerSection';

interface College {
    id: number;
    name: string;
}

const useFetchColleges = () => {
    const [colleges, setColleges] = React.useState<College[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchColleges = async () => {
            try {
                const response = await axios.get('/api/colleges');
                setColleges(response.data);
                setTimeout(() => setIsLoading(false), 2000);
            } catch (error) {
                console.error('Error fetching colleges:', error);
                setIsLoading(false);
            }
        };
        fetchColleges();
    }, []);

    return { colleges, setColleges, isLoading };
};

const useTheForm = () => {
  const [formData, setFormData] = React.useState({
    name: '',
    designation: '',
    collegeId: '',
    collegeName: '',
    phone: '',
    email: '',
    photo: null as File | null,
    reason: '',
    researchPaper: null as File | null,
    committeeMember: '',
  });

  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'designation') {
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
            collegeId: '',
            collegeName: '',
            committeeMember: value === 'Council Member' ? '' : prevData.committeeMember,
        }));
    } else if (name === 'photo' || name === 'researchPaper') {
        const file = (e.target as HTMLInputElement).files?.[0] || null;
        setFormData((prevData) => ({
            ...prevData,
            [name]: file,
        }));
    } else {
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    }
    console.log('Updated form data:', formData);
  }, [formData]);

  const resetForm = () => {
    setFormData({
      name: '',
      designation: '',
      collegeId: '',
      collegeName: '',
      phone: '',
      email: '',
      photo: null,
      reason: '',
      researchPaper: null,
      committeeMember: '',
    });
  };

  return { formData, handleChange, resetForm, setFormData };
};

const InputField = forwardRef<HTMLInputElement, { label: string, name: string, value: string | null, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, borderClass?: string, error?: string, required?: boolean }>(({ label, name, value, onChange, type = 'text', borderClass = '', error, required }, ref) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}:</label>
        <input
            type={type}
            name={name}
            value={type !== 'file' ? value || '' : undefined}
            onChange={onChange}
            required={required}
            className={`${styles.inputField} ${borderClass} ${error ? styles.errorBorder : ''}`}
            ref={ref}
        />
        {error && <p className={styles.errorText}>{error}</p>}
    </div>
));

InputField.displayName = 'InputField';

const SelectField: React.FC<{ label: string, name: string, value: string, onChange: any, options: { value: string | number, label: string }[], borderClass?: string }> = ({ label, name, value, onChange, options, borderClass = '' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}:</label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            required
            className={`${styles.inputField} ${borderClass}`}
        >
            <option value="" disabled>Select {label.toLowerCase()}</option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>
    </div>
);

const RegistrationForm: React.FC = () => {
    const { colleges, setColleges, isLoading } = useFetchColleges();
    const { formData, handleChange, resetForm, setFormData } = useTheForm();
    const [searchCollege, setSearchCollege] = React.useState('');
    const [newCollege, setNewCollege] = React.useState('');
    const [addingCollege, setAddingCollege] = React.useState(false);
    const [collegeWarning, setCollegeWarning] = React.useState('');
    const [emailBorderClass, setEmailBorderClass] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [submissionStatus, setSubmissionStatus] = React.useState<string | null>(null);

    const photoInputRef = React.useRef<HTMLInputElement | null>(null);

    const handleSearchCollege = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const searchValue = e.target.value;
        setSearchCollege(searchValue);

        if (searchValue.length > 2) {
            try {
                const response = await axios.get(`/api/colleges/search?q=${searchValue}`);
                setColleges(response.data);
                setCollegeWarning('');
            } catch (error) {
                console.error('Error searching colleges:', error);
            }
        }

        handleChange(e);
    };

    const handleSelectCollege = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = e.target.value;

        if (selectedValue === 'other') {
            setNewCollege('');
        }

        handleChange({ target: { name: 'collegeId', value: selectedValue } } as React.ChangeEvent<HTMLInputElement>);
        const selectedCollege = colleges.find((college) => college.id === parseInt(selectedValue));

        if (selectedCollege) {
            handleChange({ target: { name: 'collegeName', value: selectedCollege.name } } as React.ChangeEvent<HTMLInputElement>);
        }
    };

    const handleAddCollege = async () => {
        if (!newCollege) return;
        setAddingCollege(true);

        try {
            const response = await axios.post('/api/colleges/add', { name: newCollege });
            const addedCollege = { id: response.data.id, name: newCollege };
            setColleges([...colleges, addedCollege]);
            setFormData((prevData) => ({
                ...prevData,
                collegeName: newCollege,
                collegeId: response.data.id,
            }));
            setNewCollege('');
            setCollegeWarning('');
        } catch (error) {
            console.error('Error adding college:', error);
            setCollegeWarning('Failed to add college. Please try again.');
        } finally {
            setAddingCollege(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formDataToSend = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (value) {
                formDataToSend.append(key, value as any);
            }
        });

        try {
            const response = await axios.post('/api/registrations/register', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSubmissionStatus('success');
            resetForm();
            setEmailBorderClass('');
            setCollegeWarning('');

            if (photoInputRef.current) {
                photoInputRef.current.value = '';
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data.message || 'An error occurred. Please try again.';
                if (errorMessage.toLowerCase().includes('email')) {
                    setEmailBorderClass(styles.errorBorder);
                    setCollegeWarning(errorMessage);
                } else {
                    setEmailBorderClass('');
                    setCollegeWarning(errorMessage);
                }
            } else {
                console.error('Error:', error);
                setCollegeWarning('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClear = () => {
        resetForm();
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <>
            <div className="App">
                <BannerSection />
            </div>

            <div className={styles.formContainer}>
                <h2 className={styles.heading}>Event Registration Form</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <InputField label="Name" name="name" value={formData.name} onChange={handleChange} required />
                    <SelectField
                        label="Designation"
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        options={[
                            { value: 'Principal', label: 'Principal' },
                            { value: 'Chair Person', label: 'Chair Person' },
                            { value: 'Council Member', label: 'Council Member' },
                            { value: 'Vice-Chancellor', label: 'Vice-Chancellor' },
                        ]}
                    />

                    {(formData.designation === 'Chair Person' || formData.designation === 'Principal') && (
                        <div>
                            <label htmlFor="college" className="block text-sm font-medium text-gray-700">College:</label>
                            <select
                                name="collegeId"
                                value={formData.collegeId}
                                onChange={handleSelectCollege}
                                className={styles.inputField}
                            >
                                <option value="">Select a college</option>
                                {colleges.map((college) => (
                                    <option key={college.id} value={college.id}>{college.name}</option>
                                ))}
                                <option value="other">Add new college</option>
                            </select>
                            {formData.collegeId === 'other' && (
                                <div>
                                    <InputField
                                        label="New College Name"
                                        name="newCollege"
                                        value={newCollege}
                                        onChange={(e) => setNewCollege(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCollege}
                                        disabled={addingCollege}
                                        className={styles.button}
                                    >
                                        {addingCollege ? 'Adding...' : 'Add College'}
                                    </button>
                                    {collegeWarning && <p className={styles.errorText}>{collegeWarning}</p>}
                                </div>
                            )}
                        </div>
                    )}

                    {formData.designation === 'Council Member' && (
                        <InputField
                            label="Committee Member"
                            name="committeeMember"
                            value={formData.committeeMember}
                            onChange={handleChange}
                        />
                    )}

                    <InputField
                        label="Phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        type="tel"
                        required
                    />

                    <InputField
                        label="Email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        type="email"
                        borderClass={emailBorderClass}
                        required
                    />

                    <InputField
                        label="Photo"
                        name="photo"
                        value={null}
                        onChange={handleChange}
                        type="file"
                        ref={photoInputRef}
                    />

                    <InputField
                        label="Reason for Registration"
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        type="text"
                        required
                    />

                    <InputField
                        label="Research Paper"
                        name="researchPaper"
                        value={null}
                        onChange={handleChange}
                        type="file"
                        required
                    />

                    <div className={styles.buttonContainer}>
                        <button type="submit" className={styles.button} disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </button>
                        <button type="button" onClick={handleClear} className={styles.button}>
                            Clear
                        </button>
                    </div>

                    {submissionStatus === 'success' && (
                        <p className={styles.successMessage}>Registration submitted successfully!</p>
                    )}
                </form>
            </div>
        </>
    );
};

export default RegistrationForm;
