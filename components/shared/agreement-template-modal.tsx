import React, { useState } from 'react';
import { useGenerateAgreementMutation } from '@/lib/api/hooks/useCompanies';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div style={{ height: '150px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
});

interface AgreementTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  initialEmail?: string;
  companyName?: string;
  vendorName?: string;
}

export const AgreementTemplateModal: React.FC<AgreementTemplateModalProps> = ({
  isOpen,
  onClose,
  companyId,
  initialEmail = '',
  companyName = '',
  vendorName = '',
}) => {
  const { mutateAsync: generateAgreement, isPending } = useGenerateAgreementMutation();
  
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    scheduleNo: '',
    scheduleDate: '',
    referredClient: '',
    engagementName: '',
    scopeSummary: '',
    totalClientContractValue: '',
    numberOfProgressPayments: '',
    expectedEngagementStart: '',
    totalReferralFee: '',
    numberOfInstalments: '',
    instalmentAmount: '',
    accountName: '',
    bsbAccount: '',
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        companyId,
        email,
        message: message || undefined,
      };

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '') {
          if ([
            'totalClientContractValue', 
            'numberOfProgressPayments', 
            'totalReferralFee', 
            'numberOfInstalments', 
            'instalmentAmount'
          ].includes(key)) {
            payload[key] = Number(value);
          } else {
            payload[key] = value;
          }
        }
      });

      const blob = await generateAgreement(payload);

      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Referral_Agreement_${formData.scheduleNo || companyId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      onClose();
    } catch (error) {
      console.error(error);
      alert('An error occurred while compiling and dispatching the agreement portfolio.');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '14px'
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '20px' }}>
      <style>
        {`
          .small-placeholder::placeholder {
            font-size: 11px !important;
            color: #94a3b8 !important;
            font-weight: 400;
          }
          .quill-container .ql-editor {
            min-height: 120px;
            max-height: 200px;
            font-size: 13px;
          }
          .quill-container .ql-editor.ql-blank::before {
            font-size: 11px !important;
            color: #94a3b8 !important;
            font-style: normal !important;
          }
        `}
      </style>
      
      <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>Generate & Send Referral Agreement</h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Email Transmission Parameters</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Recipient Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Recipient email address" className="small-placeholder" style={inputStyle} />
              </div>
              <div className="quill-container">
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Cover Message</label>
                <ReactQuill theme="snow" value={message} onChange={setMessage} placeholder="Type your message here" modules={{ toolbar: [['bold', 'italic', 'underline', 'link'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean']] }} />
              </div>
            </div>
          </div>

          <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Agreement Schedule Specification Data</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Schedule No</label>
              <input type="text" name="scheduleNo" value={formData.scheduleNo} onChange={handleChange} placeholder="Schedule number" className="small-placeholder" style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Schedule Date</label>
              <input type="date" name="scheduleDate" value={formData.scheduleDate} onChange={handleChange} className="small-placeholder" style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Referred Client</label>
              <input type="text" name="referredClient" value={formData.referredClient} onChange={handleChange} placeholder="Client name" className="small-placeholder" style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Engagement Name</label>
              <input type="text" name="engagementName" value={formData.engagementName} onChange={handleChange} placeholder="Engagement name" className="small-placeholder" style={inputStyle} />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Scope Summary</label>
              <textarea name="scopeSummary" value={formData.scopeSummary} onChange={handleChange} placeholder="Scope summary details" className="small-placeholder" style={{ ...inputStyle, minHeight: '50px' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Total Contract Value (AUD)</label>
              <input type="number" name="totalClientContractValue" value={formData.totalClientContractValue} onChange={handleChange} placeholder="Total contract value" className="small-placeholder" style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Progress Payments Count</label>
              <input type="number" name="numberOfProgressPayments" value={formData.numberOfProgressPayments} onChange={handleChange} placeholder="Number of progress payments" className="small-placeholder" style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Expected Start Date</label>
              <input type="date" name="expectedEngagementStart" value={formData.expectedEngagementStart} onChange={handleChange} className="small-placeholder" style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Total Referral Fee (AUD)</label>
              <input type="number" name="totalReferralFee" value={formData.totalReferralFee} onChange={handleChange} placeholder="Total referral fee" className="small-placeholder" style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Installments Count</label>
              <input type="number" name="numberOfInstalments" value={formData.numberOfInstalments} onChange={handleChange} placeholder="Number of installments" className="small-placeholder" style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Installment Amount (AUD)</label>
              <input type="number" name="instalmentAmount" value={formData.instalmentAmount} onChange={handleChange} placeholder="Installment amount" className="small-placeholder" style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Account Name</label>
              <input type="text" name="accountName" value={formData.accountName} onChange={handleChange} placeholder="Account name" className="small-placeholder" style={inputStyle} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>BSB & Account Details</label>
              <input type="text" name="bsbAccount" value={formData.bsbAccount} onChange={handleChange} placeholder="Account details" className="small-placeholder" style={inputStyle} />
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button type="button" onClick={onClose} disabled={isPending} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', background: '#fff', fontSize: '12px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={isPending} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: '#2563eb', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
              {isPending ? 'Compiling & Dispatched Email...' : 'Generate & Send Agreement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};