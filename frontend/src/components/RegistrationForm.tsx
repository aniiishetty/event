import React from 'react';
import axios from 'axios';
import styles from '../styles/RegistrationForm.module.css';
import LoadingScreen from './LoadingScreen'; // Import the LoadingScreen component

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
                const response = await axios.get('http://localhost:3000/api/colleges');
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
const useForm = () => {
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
const InputField: React.FC<{ label: string, name: string, value: string | null, onChange: any, type?: string, borderClass?: string }> = ({ label, name, value, onChange, type = 'text', borderClass = '' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}:</label>
        <input
            type={type}
            name={name}
            value={type !== 'file' ? value || '' : undefined}
            onChange={onChange}
            required={name !== 'photo' && name !== 'researchPaper'}
            className={`${styles.inputField} ${borderClass}`}
        />
    </div>
);

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
    const { formData, handleChange, resetForm, setFormData } = useForm();
    const [searchCollege, setSearchCollege] = React.useState('');
    const [newCollege, setNewCollege] = React.useState('');
    const [addingCollege, setAddingCollege] = React.useState(false);
    const [collegeWarning, setCollegeWarning] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false); // Add submitting state
    const [submissionStatus, setSubmissionStatus] = React.useState<string | null>(null);

    // Handle college search and filter matches
    const handleSearchCollege = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const searchValue = e.target.value;
        setSearchCollege(searchValue);

        if (searchValue.length > 2) {
            try {
                const response = await axios.get(`http://localhost:3000/api/colleges/search?q=${searchValue}`);
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
            const response = await axios.post('http://localhost:3000/api/colleges/add', { name: newCollege });
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
      const response = await axios.post('http://localhost:3000/api/registrations/register', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmissionStatus('success'); // Update submission status
      
      resetForm();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setCollegeWarning(error.response?.data.message || 'An error occurred. Please try again.');
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

    return (
        <>
            {/* Banner Image with Overlay Text */}
            <div className={styles.bannerContainer}>
                {/* Logos */}
                <div className={styles.logosContainer}>
                    <img
                        src="https://vectorseek.com/wp-content/uploads/2023/09/AICTE-Logo-Vector.svg-.png"
                        alt="AICTE Logo"
                        className={styles.aicteLogo}
                    />
                    <img
                        src="https://iimstc.com/wp-content/uploads/2024/06/VTU-New.jpg"
                        alt="VTU Logo"
                        className={styles.vtuLogo}
                    />
                    <img
                        src="https://iimstc.com/wp-content/uploads/2021/10/log.png"
                        alt="IIMSTC Logo"
                        className={styles.iimstcLogo}
                    />
                    <img
                        src="https://presentations.gov.in/wp-content/uploads/2020/06/UGC-Preview.png?x31571"
                        alt="UGC Logo"
                        className={styles.ugcLogo}
                    />
                </div>

                {/* Banner Image */}
                <img
                    src="https://iimstc.com/wp-content/themes/eikra/assets/img/banner.jpg"
                    alt="Event Banner"
                    className={styles.bannerImage}
                />
                
                {/* Banner Text */}
                <div className={styles.bannerText}>
                    <h1>An International Forum on Transforming India Through International Internship</h1>
                    <p>
                        <span className={styles.IIMSTC}>IIMSTC</span> &gt; 
                        <span className={styles.IIMSTC}>Events</span> &gt; 
                        An International Forum on Transforming India Through International Internship
                    </p>
                </div>
            </div>

            {/* Form Container */}
            <div className={styles.formContainer}>
                <h2 className={styles.heading}>Event Registration</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <InputField label="Name" name="name" value={formData.name} onChange={handleChange} />
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
                                className={`${styles.inputField} ${collegeBorderClass}`}
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
                    <InputField label="Email" name="email" value={formData.email} onChange={handleChange} type="email" />
                    <InputField label="Photo" name="photo" value={null} onChange={handleChange} type="file" />
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason for Visit:</label>
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

                    <button type="submit" className={styles.button} disabled={isSubmitting}>Register</button>
                    {/* Display college warning message below the register button */}
                    {collegeWarning && (
                        <p className={`${styles.warningMessage} ${styles.errorText}`}>{collegeWarning}</p>
                    )}
                    {submissionStatus === 'success' && (
        <div className={styles.submissionStatus}>
          <p>Registration successful! We will contact you soon.</p>
        </div>
      )}
                </form>
            </div>
        </>
    );
};

export default RegistrationForm;
