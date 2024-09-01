import React, { forwardRef } from 'react';
import axios from 'axios';
import styles from '../styles/RegistrationForm.module.css';
import LoadingScreen from './LoadingScreen'; // Import the LoadingScreen component
import useForm from '../hooks/useForm';

interface College {
    id: number;
    name: string;
}

// Custom hook to fetch and manage colleges
const useFetchColleges = () => {
    const [colleges, setColleges] = React.useState<College[]>([]);
    const [isLoading, setIsLoading] = React.useState(true); // Add loading state

    React.useEffect(() => {
        const fetchColleges = async () => {
            try {
                const response = await axios.get('/api/colleges');
                setColleges(response.data);

                // Simulate a longer loading time
                setTimeout(() => {
                    setIsLoading(false); // Set loading to false after simulated delay
                }, 2000); // Adjust the delay as needed (3000ms = 3 seconds)
            } catch (error) {
                console.error('Error fetching colleges:', error);
                setIsLoading(false); // Ensure loading state is turned off on error
            }
        };
        fetchColleges();
    }, []);

    return { colleges, setColleges, isLoading };
};

// Custom hook to manage form data
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
    });

    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'photo' || name === 'researchPaper') {
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
    }, []);

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
        });
    };

    return { formData, handleChange, resetForm, setFormData };
};

// Reusable input field component
const InputField = forwardRef<HTMLInputElement, {
    label: string;
    name: string;
    value: string | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    borderClass?: string;
    error?: string;
}>(({ label, name, value, onChange, type = 'text', borderClass = '', error }, ref) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}:</label>
        <input
            type={type}
            name={name}
            value={type !== 'file' ? value || '' : undefined}
            onChange={onChange}
            required={name !== 'photo' && name !== 'researchPaper'}
            className={`${borderClass} ${error ? 'error-class' : ''}`}
            ref={ref} // Attach the ref
        />
        {error && <p className="error-class">{error}</p>}
    </div>
));


InputField.displayName = 'InputField';


// Reusable select field component
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


// Main registration form component
const RegistrationForm: React.FC = () => {
    const { colleges, setColleges, isLoading } = useFetchColleges();
    const { formData, handleChange, resetForm, setFormData } = useTheForm();
    const [searchCollege, setSearchCollege] = React.useState('');
    const [newCollege, setNewCollege] = React.useState('');
    const [addingCollege, setAddingCollege] = React.useState(false);
    const [collegeWarning, setCollegeWarning] = React.useState('');
    const [emailBorderClass, setEmailBorderClass] = React.useState('');

    const [isSubmitting, setIsSubmitting] = React.useState(false); // Add submitting state
    const [submissionStatus, setSubmissionStatus] = React.useState<string | null>(null);

    const photoInputRef = React.useRef<HTMLInputElement | null>(null); // Add ref for photo input

    // Handle college search and filter matches
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


    // Handle college selection, including "Other"
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

    // Handle adding a new college
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

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true); // Set submitting state
    
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
            setSubmissionStatus('success'); // Update submission status
            resetForm();
            setEmailBorderClass(''); // Reset email border on successful submission
            setCollegeWarning(''); // Reset any college warnings on successful submission
    
            // Reset photo input value
            if (photoInputRef.current) {
                photoInputRef.current.value = '';
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data.message || 'An error occurred. Please try again.';
    
                // Check if the error is related to the email field
                if (errorMessage.toLowerCase().includes('email')) {
                    setEmailBorderClass(styles.errorBorder); // Set red border for email field
                    setCollegeWarning(errorMessage); // Show error message below register button
                } else {
                    setEmailBorderClass(''); // Reset email border if the error is not related to email
                    setCollegeWarning(errorMessage); // Show error message for other issues
                }
            } else {
                console.error('Error:', error);
                setCollegeWarning('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsSubmitting(false); // Reset submitting state
        }
    };
    
    
    // Determine border class based on form state
    const collegeBorderClass = collegeWarning ? styles.errorBorder : '';

    // Show loading screen while fetching colleges
    if (isLoading) {
        return <LoadingScreen />;
    }

    const handleClear = () => {
        resetForm(); // Call resetForm from useForm to clear form data
      };

    return (
        <>
            {/* Banner Image with Overlay Text */}
            <div className={styles.bannerContainer}>
  {/* Logo Container */}
  <div className={styles.logoContainer}>
    <div className={styles.vtuLogoContainer}>
      <img
        src="https://vtu.ac.in/wp-content/uploads/2020/10/vtu_logo.png"
        alt="VTU Logo"
        className={styles.vtuLogo}
      />
    </div>

    <div className={styles.iimstcLogoContainer}>
      <img
        src="https://iimstc.com/wp-content/uploads/2021/10/log.png"
        alt="IIMSTC Logo"
        className={styles.iimstcLogo}
      />
    </div>
  </div>

  {/* Banner Image */}
  <img
    src="https://vtu.ac.in/wp-content/uploads/2019/08/vtu-banner-1a-1516x552.jpg"
    alt="Event Banner"
    className={styles.bannerImage}
  />

  {/* Banner Text */}
  <div className={styles.bannerText}>
    <h1>Visvesvaraya Technological University Welcomes with Collaboration with <br/>
        The International Institute of Medical Science & Technology Council <br/>
        for Mega Event</h1>
    <p>
      
      Opportunities on Transforming India Through Youth Skill Development
    </p>
  </div>
</div>

      <div className='img-container'>
      <img
                        src="https://vectorseek.com/wp-content/uploads/2023/09/AICTE-Logo-Vector.svg-.png"
                        alt="AICTE Logo"
                        className={styles.aicteLogo}
                    />
                    <img
                        src="https://presentations.gov.in/wp-content/uploads/2020/06/UGC-Preview.png?x31571"
                        alt="UGC Logo"
                        className={styles.ugcLogo}
                    /></div>

            {/* Form Container */}
            <div className={styles.formContainer}>
                <h2 className={styles.heading}>Event Registration Form</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <InputField
  label="Name"
  name="name"
  value={formData.name}
  onChange={handleChange}
  style={{
    marginTop: '0.25rem', // mt-1
    display: 'block', // block
    width: '100%', // w-full
    paddingLeft: '0.75rem', // px-3
    paddingRight: '0.75rem', // px-3
    paddingTop: '0.5rem', // py-2
    paddingBottom: '0.5rem', // py-2
    borderWidth: '1px', // border
    borderColor: '#D1D5DB', // border-gray-300
    borderRadius: '0.375rem', // rounded-md
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // shadow-sm
    outline: 'none', // focus:outline-none
    focus: {
      ringColor: '#6366F1', // focus:ring-indigo-500
      borderColor: '#6366F1' // focus:border-indigo-500
    },
    fontSize: '0.875rem', // sm:text-sm
  }}
/>

                    <SelectField label="Designation" name="designation" value={formData.designation} onChange={handleChange} options={[
                        { value: 'Principal', label: 'Principal' },
                        { value: 'Chairperson', label: 'Chairperson' }
                    ]} />

                    {/* College Search and Select */}
                    <div>
                        <label htmlFor="collegeId" className="block text-sm font-medium text-gray-700">College:</label>
                        {colleges.length > 0 && (
                            <select
                                name="collegeId"
                                value={formData.collegeId}
                                onChange={handleSelectCollege}
                                className={styles.inputField} // Removed collegeBorderClass
                            >
                                <option value="">Select a college</option>
                                {colleges.map((college) => (
                                    <option key={college.id} value={college.id}>{college.name}</option>
                                ))}
                                <option value="other">Others</option>
                            </select>
                        )}
                        {formData.collegeId === 'other' && (
                            <div>
                                <label htmlFor="newCollege" className="block text-sm font-medium text-gray-700">Enter College Name:</label>
                                <input
                                    type="text"
                                    name="newCollege"
                                    value={newCollege}
                                    onChange={(e) => setNewCollege(e.target.value)}
                                    placeholder="Enter new college name"
                                    className={styles.inputField}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCollege}
                                    className={styles.button}
                                    disabled={addingCollege}
                                >
                                    {addingCollege ? 'Adding...' : 'Submit'}
                                </button>
                            </div>
                        )}
                    </div>

                    <InputField label="Phone" name="phone" value={formData.phone} onChange={handleChange} />

                    <InputField
                        label="Email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        type="email"
                        borderClass={emailBorderClass} // Only this field uses emailBorderClass
                    />

<InputField
    label="Photo"
    name="photo"
    value={null}
    onChange={handleChange}
    type="file"
    ref={photoInputRef} // Assign the ref here
/>


                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Interested in :</label>
                        <select
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            required
                            className={styles.inputField}
                        >
                            <option value="" disabled>Select reason</option>
                            <option value="To know about International Internship">To know about International Internship</option>
                            <option value="To know about Textbook">To know about Textbook</option>
                            <option value="To present research paper">To present research paper</option>
                        </select>
                    </div>
                    {formData.reason === 'To present research paper' && (
                        <InputField label="Research Paper" name="researchPaper" value={null} onChange={handleChange} type="file" />
                    )}

<div className={styles.buttonContainer}>
            <button type="submit" className={styles.button} disabled={isSubmitting}>Register</button>
            <button
              type="button"
              className={styles.button}
              onClick={handleClear}
            >
              Clear
            </button>
          </div>

                    {/* Display the error message below the register button */}
                    {collegeWarning && (
    <p className={`${styles.warningMessage} ${styles.errorText}`}>{collegeWarning}</p>
)}

                    {/* Success message after submission */}
                    {submissionStatus === 'success' && (
                        <div className={styles.submissionStatus}>
                            <p>Thank you for registering for <strong> An International Forum on Transforming India Through International Internship Event!!</strong> We will contact you soon with Invite details.</p>
                        </div>
                    )}
                </form>
            </div>
        </>
    );
};

export default RegistrationForm;
