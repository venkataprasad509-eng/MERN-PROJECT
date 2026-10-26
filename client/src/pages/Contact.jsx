import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { toast } from '../utils/toast';

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSubmitted(true);
    toast.success('Message sent! (Demo)');
  };

  return (
    <div className="page-container py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Contact Us</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Info */}
        <div className="space-y-5">
          {[
            { icon: Mail, label: 'Email', value: 'support@learnhub.dev' },
            { icon: Phone, label: 'Phone', value: '+91 80 4567 8901' },
            { icon: MapPin, label: 'Address', value: 'Koramangala, Bangalore, Karnataka 560034' },
            { icon: Clock, label: 'Hours', value: 'Mon–Fri 9am–6pm IST' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{label}</p>
                <p className="text-gray-500 text-sm">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          {submitted ? (
            <div className="card p-10 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h2>
              <p className="text-gray-500">We'll get back to you within 24 hours. (This is a demo — no message was actually sent.)</p>
              <button onClick={() => setSubmitted(false)} className="btn-primary mt-6">Send Another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input {...register('firstName', { required: true })} className={`input-field ${errors.firstName ? 'border-red-400' : ''}`} placeholder="Arjun" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input {...register('lastName', { required: true })} className={`input-field ${errors.lastName ? 'border-red-400' : ''}`} placeholder="Mehta" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" {...register('email', { required: true })} className={`input-field ${errors.email ? 'border-red-400' : ''}`} placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select {...register('subject')} className="input-field">
                  <option value="">Select a topic</option>
                  <option>General Inquiry</option>
                  <option>Technical Support</option>
                  <option>Billing Question</option>
                  <option>Instructor Application</option>
                  <option>Partnership</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea rows={5} {...register('message', { required: true, minLength: 20 })}
                  className={`input-field resize-none ${errors.message ? 'border-red-400' : ''}`}
                  placeholder="Tell us how we can help you..." />
                {errors.message && <p className="text-red-500 text-xs mt-1">Message must be at least 20 characters</p>}
              </div>
              <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                <Send className="w-4 h-4" />
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
