import { useState, ChangeEvent } from 'react';

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
        committeeMember: '', // Add committeeMember here
    });
  // Handle changes to input fields
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;

    if (type === 'file') {
      const inputElement = event.target as HTMLInputElement;
      const file = inputElement.files ? inputElement.files[0] : null;
      setFormData((prevData) => ({
        ...prevData,
        [name]: file
      }));
    } else {
      // Check if the designation is being changed
      if (name === 'designation') {
        let updatedData = {
          ...formData,
          [name]: value,
        };

        // Clear college fields and committeeMember if Vice-Chancellor or Council Member is selected
        if (value === 'Vice-Chancellor' || value === 'Council Member') {
          updatedData = {
            ...updatedData,
            collegeId: '',
            newCollege: '',
            committeeMember: value === 'Council Member' ? '' : formData.committeeMember, // Clear committeeMember only if Council Member is selected
          };
        }

        setFormData(updatedData);
      } else {
        // Handle text and select inputs
        setFormData((prevData) => ({
          ...prevData,
          [name]: value
        }));
      }
    }
  };

  // Reset the form data
  const resetForm = () => {
    setFormData({
      name: '',
      designation: '',
      collegeId: '',
      newCollege: '',
      committeeMember: '', // Reset committeeMember field
      phone: '',
      email: '',
      photo: null,
      reason: '',
      researchPaper: null
    });
  };

  return { formData, handleChange, resetForm, setFormData };
};

export default useForm;
