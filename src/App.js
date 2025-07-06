import React, { useState } from 'react';
import './App.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
export default function App() {
  const [narrative, setNarrative] = useState('');
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    allergies: '',
    insurance: '',
    ethnicity: '',
    symptoms: '',
    treatments: '',
    conditions: '',
    language: '',
    maritalStatus: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(fd => ({ ...fd, [name]: value }));
  };
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);


    const payload = {
      subject_id: Date.now() % 100000,           // or any unique integer
      age: parseFloat(formData.age) || 0,
      GENDER: formData.gender,
      LANGUAGE: formData.language,
      INSURANCE: formData.insurance,
      RELIGION: '',                              // add field or hardcode as needed
      MARITAL_STATUS: formData.maritalStatus,
      ETHNICITY: formData.ethnicity,
      Maladie_chronique: formData.conditions,
      Symptômes: formData.symptoms,
      Allergies: formData.allergies,
      Traitement_régulier: formData.treatments,
      narrative: narrative
    };

    try {
      const resp = await fetch('https://back-delicate-cloud-7611.fly.dev/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error(`Status ${resp.status}`);
      const json = await resp.json();
      setResult(json);
      setShowModal(true);

    } catch (err) {

      setError('Erreur lors de l’appel à l’API');
    } finally {
      setLoading(false);
    }
  };
  const exportPDF = () => {
    // 1) select the content and the elements to hide
    const input = document.getElementById('pdf-content');
    const hideEls = input.querySelectorAll('.no-pdf');

    // 2) hide them
    hideEls.forEach(el => (el.style.display = 'none'));

    // 3) capture the full element (using its scroll dims)
    const { scrollWidth: w, scrollHeight: h } = input;
    html2canvas(input, {
      scale: 2,
      width: w,
      height: h,
      windowWidth: w,
      windowHeight: h,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgH = (h * pdfW) / w;

      // add first page
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, imgH);

      // add extra pages if needed
      const pages = Math.ceil(imgH / pdfH);
      for (let i = 1; i < pages; i++) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -pdfH * i, pdfW, imgH);
      }

      // 4) restore visibility and save
      hideEls.forEach(el => (el.style.display = ''));
      pdf.save(`corex_report_${result.subject_id || 'patient'}.pdf`);
    });
  };

  return (
    <div className="corex-container">
      <header className="corex-header">
        <div className="corex-logo"><img src="/logo.svg" alt="Logo" /></div>
        <div className="corex-title">
          Context‑Oriented LLM‑enhanced Recommendation System
        </div>
      </header>

      <div className="corex-card">
        <div className="narrative-header">
          Start by entering the patient’s clinical narrative
        </div>
        <textarea
          className="narrative-input"
          value={narrative}
          onChange={e => setNarrative(e.target.value)}
          placeholder="Type the narrative here…"
        />

        <form className="patient-form" onSubmit={handleSubmit}>
          {/* ... your form fields ... */}
          <div className="form-row">
            {/* left column */}
            <div className="form-column">
              {/* Age */}
              <div className="form-group">
                <label>Age :</label>
                <input name="age" value={formData.age} onChange={handleFormChange} />
              </div>
              {/* Gender */}
              <div className="form-group">
                <label>Gender :</label>
                <input name="gender" value={formData.gender} onChange={handleFormChange} />
              </div>
              {/* Allergies */}
              <div className="form-group">
                <label>Allergies :</label>
                <input name="allergies" value={formData.allergies} onChange={handleFormChange} />
              </div>
              {/* Insurance */}
              <div className="form-group">
                <label>Insurance :</label>
                <input name="insurance" value={formData.insurance} onChange={handleFormChange} />
              </div>
              {/* Ethnicity */}
              <div className="form-group">
                <label>Ethnicity :</label>
                <input name="ethnicity" value={formData.ethnicity} onChange={handleFormChange} />
              </div>
            </div>

            {/* right column */}
            <div className="form-column">
              {/* Symptoms */}
              <div className="form-group">
                <label>Symptoms :</label>
                <input name="symptoms" value={formData.symptoms} onChange={handleFormChange} />
              </div>
              {/* Treatments */}
              <div className="form-group">
                <label>Regular Treatments :</label>
                <input name="treatments" value={formData.treatments} onChange={handleFormChange} />
              </div>
              {/* Conditions */}
              <div className="form-group">
                <label>Chronic Conditions :</label>
                <input name="conditions" value={formData.conditions} onChange={handleFormChange} />
              </div>
              {/* Language */}
              <div className="form-group">
                <label>Language :</label>
                <input name="language" value={formData.language} onChange={handleFormChange} />
              </div>
              {/* Marital Status */}
              <div className="form-group">
                <label>Marital Status :</label>
                <input name="maritalStatus" value={formData.maritalStatus} onChange={handleFormChange} />
              </div>
            </div>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Generating…' : 'Generate Recommendation'}
          </button>
        </form>

        {error && <div className="error">{error}</div>}

        {result && (
          <div className="results">
            <h3>Recommendations</h3>
            <ul>
              {result.recommended_drugs.map((d, i) => (
                <li key={d}>
                  {d} — prob: {(result.probabilities[i] * 100).toFixed(1)}%
                </li>
              ))}
            </ul>
            <h3>Explanation</h3>
            <p>{result.explanation}</p>
            <h4>Similar Cases</h4>
            <ul>
              {result.similar_cases.map((c, i) => (
                <li key={i}>
                  <strong>Case {i + 1}:</strong> {c.Maladie_chronique}, {c.Symptômes}, {c.Allergies}, {c.Traitement_régulier}
                </li>
              ))}
            </ul>
          </div>
        )}


        {showModal && result && (
          <div className="modal-overlay">
            <div className="modal-content" id="pdf-content">
              <header className="modal-header">
                <img src="/logo.svg" alt="COREX" className="modal-logo" />
                <h2>Recommendation Summary</h2>
              </header>

              <section className="patient-summary">
                <h3>Patient Profile Summary</h3>
                <p><strong>Regular treatment:</strong> {formData.treatments}</p>
                <p><strong>Chronic Conditions:</strong> {formData.conditions}</p>
                <p><strong>Allergies:</strong> {formData.allergies}</p>
                <p><strong>Symptoms:</strong> {formData.symptoms}</p>
              </section>

              <section className="recommendation">
                <div className="confidence">
                  Confidence Score {(result.probabilities[0] * 100).toFixed(1)}%
                </div>
                <h1 className="drug-name">{result.recommended_drugs[0]}</h1>
              </section>

              <section className="similar-cases">
                <h3>Similar Clinical Cases</h3>
                {result.similar_cases.map((c, i) => (
                  <div key={i} className="case-item">
                    <p><strong>Case {i + 1}:</strong></p>
                    <p>• {c.Maladie_chronique}</p>
                    <p>• {c.Symptômes}</p>
                    <p>• {c.Allergies}</p>
                    <p>• {c.Traitement_régulier}</p>
                  </div>
                ))}
              </section>

              <section className="explanation-text">
                <p>{result.explanation}</p>
              </section>


              {/* … inside your modal-actions … */}
              <div className="modal-actions">
                <button className="no-pdf" onClick={() => setShowModal(false)}>Reset</button>
                <button className="no-pdf export-button" onClick={exportPDF}>
                  Download PDF Report
                </button>
              </div>

            </div>


          </div>
        )}
      </div>
    </div>
  );
}
