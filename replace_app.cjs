const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

content = content.replace(/import confetti from 'canvas-confetti';\nimport AnalyticsPanel from '\.\/components\/AnalyticsPanel';/, 
`import confetti from 'canvas-confetti';
import CustomSelect from './components/CustomSelect';
import AnalyticsPanel from './components/AnalyticsPanel';`);

content = content.replace(
`<select 
              value={themeColor || 'blue'}
              onChange={(e) => {
                localStorage.setItem('themeColor', e.target.value);
                document.documentElement.setAttribute('data-color-theme', e.target.value);
                window.dispatchEvent(new Event('storage'));
              }} 
              style={{ padding: '7px 14px', borderRadius: '40px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
              title="Change Accent Color"
            >
              <option value="blue">🔵 Classic Blue</option>
              <option value="professional">⚫ Black & White</option>
              <option value="pink">🌸 Vibrant Pink</option>
              <option value="neon">⚡ Neon Tech</option>
              <option value="emerald">🌿 Emerald</option>
            </select>`,
`<CustomSelect 
              value={themeColor || 'blue'}
              onChange={(e) => {
                localStorage.setItem('themeColor', e.target.value);
                document.documentElement.setAttribute('data-color-theme', e.target.value);
                window.dispatchEvent(new Event('storage'));
              }} 
              style={{ padding: '7px 14px', borderRadius: '40px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 600, width: '170px' }}
              options={[
                { value: "blue", label: "🔵 Classic Blue" },
                { value: "professional", label: "⚫ Black & White" },
                { value: "pink", label: "🌸 Vibrant Pink" },
                { value: "neon", label: "⚡ Neon Tech" },
                { value: "emerald", label: "🌿 Emerald" }
              ]}
            />`);

content = content.replace(
`<select 
                              value={newHabitData.category}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewHabitData({ ...newHabitData, category: val });
                                if (val === 'Body & Gym') setActiveTab('body');
                              }}
                              style={{ 
                                width: '100%', padding: '12px 16px', borderRadius: '12px', 
                                background: 'var(--bg-card)', 
                                color: newHabitData.category ? 'var(--text-main)' : 'var(--text-muted)', 
                                border: '1px solid var(--border-color)', fontSize: '0.92rem', fontWeight: 600, outline: 'none', cursor: 'pointer' 
                              }}
                            >
                              <option value="" disabled hidden>Select Category...</option>
                              <option value="Coding">Coding Habit</option>
                              <option value="Study">Study Habit</option>
                              <option value="Reading">Reading</option>
                              <option value="Body & Gym">Fitness & Health</option>
                              <option value="Diet & Nutrition">Diet & Nutrition</option>
                              <option value="Money">Money Habit</option>
                              <option value="Deep Focus">Deep Focus</option>
                              <option value="Other">Custom Category</option>
                            </select>`,
`<CustomSelect 
                              value={newHabitData.category}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewHabitData({ ...newHabitData, category: val });
                                if (val === 'Body & Gym') setActiveTab('body');
                              }}
                              style={{ 
                                width: '100%', padding: '12px 16px', borderRadius: '12px', 
                                background: 'var(--bg-card)', 
                                color: newHabitData.category ? 'var(--text-main)' : 'var(--text-muted)', 
                                border: '1px solid var(--border-color)', fontSize: '0.92rem', fontWeight: 600 
                              }}
                              options={[
                                { value: "", label: "Select Category..." },
                                { value: "Coding", label: "Coding Habit" },
                                { value: "Study", label: "Study Habit" },
                                { value: "Reading", label: "Reading" },
                                { value: "Body & Gym", label: "Fitness & Health" },
                                { value: "Diet & Nutrition", label: "Diet & Nutrition" },
                                { value: "Money", label: "Money Habit" },
                                { value: "Deep Focus", label: "Deep Focus" },
                                { value: "Other", label: "Custom Category" }
                              ]}
                            />`);

content = content.replace(
`<select
                              value={newHabitData.durationMode === 'custom' ? 'custom' : newHabitData.challengeDays}
                              onChange={(e) => {
                                if (e.target.value === 'custom') {
                                  setNewHabitData({ ...newHabitData, durationMode: 'custom', challengeDays: '' });
                                } else {
                                  setNewHabitData({ ...newHabitData, durationMode: 'preset', challengeDays: Number(e.target.value) });
                                }
                              }}
                              style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                            >
                              <option value={7}>7 Days</option>
                              <option value={14}>14 Days</option>
                              <option value={21}>21 Days</option>
                              <option value={30}>30 Days</option>
                              <option value={60}>60 Days</option>
                              <option value={90}>90 Days</option>
                              <option value="custom">Custom...</option>
                            </select>`,
`<CustomSelect
                              value={newHabitData.durationMode === 'custom' ? 'custom' : newHabitData.challengeDays}
                              onChange={(e) => {
                                if (e.target.value === 'custom') {
                                  setNewHabitData({ ...newHabitData, durationMode: 'custom', challengeDays: '' });
                                } else {
                                  setNewHabitData({ ...newHabitData, durationMode: 'preset', challengeDays: Number(e.target.value) });
                                }
                              }}
                              style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 700, width: '130px' }}
                              options={[
                                { value: 7, label: "7 Days" },
                                { value: 14, label: "14 Days" },
                                { value: 21, label: "21 Days" },
                                { value: 30, label: "30 Days" },
                                { value: 60, label: "60 Days" },
                                { value: 90, label: "90 Days" },
                                { value: "custom", label: "Custom..." }
                              ]}
                            />`);

content = content.replace(
`<select 
                            className="glass-input"
                            value={editingHabitData.category}
                            onChange={e => setEditingHabitData({...editingHabitData, category: e.target.value})}
                          >
                            <option value="Coding">Coding Habit</option>
                            <option value="Study">Study Habit</option>
                            <option value="Reading">Reading</option>
                            <option value="Body & Gym">Fitness & Health</option>
                            <option value="Diet & Nutrition">Diet & Nutrition</option>
                            <option value="Money">Money Habit</option>
                            <option value="Deep Focus">Deep Focus</option>
                            <option value="Other">Custom Category</option>
                          </select>`,
`<CustomSelect 
                            className="glass-input"
                            value={editingHabitData.category}
                            onChange={e => setEditingHabitData({...editingHabitData, category: e.target.value})}
                            options={[
                              { value: "Coding", label: "Coding Habit" },
                              { value: "Study", label: "Study Habit" },
                              { value: "Reading", label: "Reading" },
                              { value: "Body & Gym", label: "Fitness & Health" },
                              { value: "Diet & Nutrition", label: "Diet & Nutrition" },
                              { value: "Money", label: "Money Habit" },
                              { value: "Deep Focus", label: "Deep Focus" },
                              { value: "Other", label: "Custom Category" }
                            ]}
                          />`);

content = content.replace(
`<select
                                  value={editingHabitData.durationMode === 'custom' ? 'custom' : editingHabitData.challengeDays}
                                  onChange={(e) => {
                                    if (e.target.value === 'custom') {
                                      setEditingHabitData({ ...editingHabitData, durationMode: 'custom', challengeDays: '' });
                                    } else {
                                      setEditingHabitData({ ...editingHabitData, durationMode: 'preset', challengeDays: Number(e.target.value) });
                                    }
                                  }}
                                  style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                                >
                                  <option value={7}>7 Days</option>
                                  <option value={14}>14 Days</option>
                                  <option value={21}>21 Days</option>
                                  <option value={30}>30 Days</option>
                                  <option value={60}>60 Days</option>
                                  <option value={90}>90 Days</option>
                                  <option value="custom">Custom...</option>
                                </select>`,
`<CustomSelect
                                  value={editingHabitData.durationMode === 'custom' ? 'custom' : editingHabitData.challengeDays}
                                  onChange={(e) => {
                                    if (e.target.value === 'custom') {
                                      setEditingHabitData({ ...editingHabitData, durationMode: 'custom', challengeDays: '' });
                                    } else {
                                      setEditingHabitData({ ...editingHabitData, durationMode: 'preset', challengeDays: Number(e.target.value) });
                                    }
                                  }}
                                  style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 700, width: '130px' }}
                                  options={[
                                    { value: 7, label: "7 Days" },
                                    { value: 14, label: "14 Days" },
                                    { value: 21, label: "21 Days" },
                                    { value: 30, label: "30 Days" },
                                    { value: 60, label: "60 Days" },
                                    { value: 90, label: "90 Days" },
                                    { value: "custom", label: "Custom..." }
                                  ]}
                                />`);

fs.writeFileSync('src/App.jsx', content);
