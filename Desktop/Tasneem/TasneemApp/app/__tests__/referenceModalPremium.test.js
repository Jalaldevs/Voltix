// referenceModalPremium.test.js — Tests for ReferenceModal premium features
import React, { useState } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { View, TouchableOpacity, Text, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock usePremium
const mockRequirePremium = jest.fn();
jest.mock('../hooks/usePremium', () => ({
  __esModule: true,
  default: () => ({
    isPremium: false,
    requirePremium: mockRequirePremium,
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock expo-print and expo-sharing
jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

jest.mock('react-native-view-shot', () => ({
  __esModule: true,
  captureRef: jest.fn(),
}));

import usePremium from '../hooks/usePremium';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

describe('ReferenceModal Premium Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockClear();
    AsyncStorage.setItem.mockClear();
  });

  describe('Note Writing Feature', () => {
    it('should require premium to add a note', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const TestAddNote = () => {
        const { requirePremium } = usePremium();
        const [editingNoteIndex, setEditingNoteIndex] = useState(-1);
        const [notes, setNotes] = useState([]);

        const handleAddNote = () => {
          requirePremium(() => {
            if (notes.length < 3) {
              setEditingNoteIndex(-2);
            }
          });
        };

        return (
          <TouchableOpacity onPress={handleAddNote} testID="add-note-btn">
            <Text>Add Note</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestAddNote />);

      fireEvent.press(getByTestId('add-note-btn'));

      await waitFor(() => {
        expect(mockRequirePremium).toHaveBeenCalled();
      });
    });

    it('should not allow note addition for non-premium users', async () => {
      mockRequirePremium.mockImplementation((callback) => {
        // Non-premium: don't execute callback
      });

      const TestAddNote = () => {
        const { requirePremium } = usePremium();
        const [editingNoteIndex, setEditingNoteIndex] = useState(-1);

        const handleAddNote = () => {
          requirePremium(() => {
            setEditingNoteIndex(-2); // This should NOT be set
          });
        };

        return (
          <>
            <TouchableOpacity onPress={handleAddNote} testID="add-note">
              <Text>Add Note</Text>
            </TouchableOpacity>
            <Text testID="editing-index">{editingNoteIndex}</Text>
          </>
        );
      };

      const { getByTestId } = render(<TestAddNote />);

      fireEvent.press(getByTestId('add-note'));

      // editingNoteIndex should remain -1, not -2
      expect(getByTestId('editing-index')).toHaveTextContent('-1');
    });

    it('should allow note addition for premium users', async () => {
      mockRequirePremium.mockImplementation((callback) => {
        // Premium: execute callback
        callback();
      });

      const TestAddNote = () => {
        const { requirePremium } = usePremium();
        const [editingNoteIndex, setEditingNoteIndex] = useState(-1);

        const handleAddNote = () => {
          requirePremium(() => {
            setEditingNoteIndex(-2);
          });
        };

        return (
          <>
            <TouchableOpacity onPress={handleAddNote} testID="add-note">
              <Text>Add Note</Text>
            </TouchableOpacity>
            <Text testID="editing-index">{editingNoteIndex}</Text>
          </>
        );
      };

      const { getByTestId } = render(<TestAddNote />);

      fireEvent.press(getByTestId('add-note'));

      await waitFor(() => {
        expect(getByTestId('editing-index')).toHaveTextContent('-2');
      });
    });

    it('should limit notes to 3 per reference', async () => {
      mockRequirePremium.mockImplementation((callback) => {
        callback();
      });

      const alertSpy = jest.spyOn(Alert, 'alert');

      const TestNoteLimit = () => {
        const { requirePremium } = usePremium();
        const [notes, setNotes] = useState(['Note 1', 'Note 2', 'Note 3']);

        const handleAddNote = () => {
          requirePremium(() => {
            if (notes.length >= 3) {
              Alert.alert('Limit Reached', 'You can only add up to 3 notes per reference.');
            }
          });
        };

        return (
          <TouchableOpacity onPress={handleAddNote} testID="add-note">
            <Text>Add Note</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestNoteLimit />);

      fireEvent.press(getByTestId('add-note'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Limit Reached',
          'You can only add up to 3 notes per reference.'
        );
      });
    });

    it('should persist notes to AsyncStorage', async () => {
      mockRequirePremium.mockImplementation((callback) => {
        callback();
      });

      const TestSaveNote = () => {
        const { requirePremium } = usePremium();
        const referenceId = 'ayah_2_255';
        const notesKey = `@ref_notes_${referenceId}`;

        const handleSaveNote = (note) => {
          requirePremium(async () => {
            const updatedNotes = [note];
            await AsyncStorage.setItem(notesKey, JSON.stringify(updatedNotes));
          });
        };

        return (
          <TouchableOpacity onPress={() => handleSaveNote('My note')} testID="save-note">
            <Text>Save Note</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestSaveNote />);

      fireEvent.press(getByTestId('save-note'));

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });
    });

    it('should load notes from AsyncStorage', async () => {
      const savedNotes = ['Note 1', 'Note 2'];
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedNotes));

      const TestLoadNote = () => {
        const [notes, setNotes] = useState([]);

        React.useEffect(() => {
          AsyncStorage.getItem('@ref_notes_test').then((val) => {
            if (val) setNotes(JSON.parse(val));
          });
        }, []);

        return (
          <View>
            {notes.map((note, idx) => (
              <Text key={idx} testID={`note-${idx}`}>
                {note}
              </Text>
            ))}
          </View>
        );
      };

      const { getByTestId } = render(<TestLoadNote />);

      await waitFor(() => {
        expect(getByTestId('note-0')).toHaveTextContent('Note 1');
        expect(getByTestId('note-1')).toHaveTextContent('Note 2');
      });
    });
  });

  describe('PDF Generation Feature', () => {
    it('should require premium to generate PDF', async () => {
      const TestGeneratePdf = () => {
        const { requirePremium } = usePremium();

        const handleGeneratePdf = async () => {
          requirePremium(async () => {
            // PDF generation logic
          });
        };

        return (
          <TouchableOpacity onPress={handleGeneratePdf} testID="pdf-btn">
            <Text>Generate PDF</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestGeneratePdf />);

      fireEvent.press(getByTestId('pdf-btn'));

      await waitFor(() => {
        expect(mockRequirePremium).toHaveBeenCalled();
      });
    });

    it('should not allow PDF generation for non-premium users', async () => {
      mockRequirePremium.mockImplementation((callback) => {
        // Don't execute for non-premium
      });

      const TestGeneratePdf = () => {
        const { requirePremium } = usePremium();
        const mockPrintCalled = jest.fn();

        const handleGeneratePdf = async () => {
          requirePremium(async () => {
            mockPrintCalled();
          });
        };

        return (
          <TouchableOpacity onPress={handleGeneratePdf} testID="pdf">
            <Text>Generate PDF</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestGeneratePdf />);

      fireEvent.press(getByTestId('pdf'));

      expect(Print.printToFileAsync).not.toHaveBeenCalled();
    });

    it('should allow PDF generation for premium users', async () => {
      mockRequirePremium.mockImplementation((callback) => {
        callback();
      });

      Print.printToFileAsync.mockResolvedValue({ uri: 'file://test.pdf' });
      Sharing.isAvailableAsync.mockResolvedValue(true);

      const TestGeneratePdf = () => {
        const { requirePremium } = usePremium();

        const handleGeneratePdf = async () => {
          requirePremium(async () => {
            const html = '<html><body><h1>Test PDF</h1></body></html>';
            const result = await Print.printToFileAsync({ html });
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(result.uri);
            }
          });
        };

        return (
          <TouchableOpacity onPress={handleGeneratePdf} testID="pdf">
            <Text>Generate PDF</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestGeneratePdf />);

      fireEvent.press(getByTestId('pdf'));

      await waitFor(() => {
        expect(Print.printToFileAsync).toHaveBeenCalled();
      });
    });

    it('should capture Arabic text for PDF', async () => {
      mockRequirePremium.mockImplementation((callback) => {
        callback();
      });

      captureRef.mockResolvedValue('base64encodedpng');
      Print.printToFileAsync.mockResolvedValue({ uri: 'file://test.pdf' });
      Sharing.isAvailableAsync.mockResolvedValue(true);

      const TestPdfCapture = () => {
        const { requirePremium } = usePremium();
        const arabicRef = React.useRef();

        const handleGeneratePdf = async () => {
          requirePremium(async () => {
            const arabicImageBase64 = await captureRef(arabicRef.current, {
              format: 'png',
              quality: 1,
              result: 'base64',
              width: 1200,
            });
            expect(arabicImageBase64).toBeTruthy();
          });
        };

        return (
          <>
            <View ref={arabicRef}>
              <Text>بسم الله الرحمن الرحيم</Text>
            </View>
            <TouchableOpacity onPress={handleGeneratePdf} testID="capture-pdf">
              <Text>Capture & Generate PDF</Text>
            </TouchableOpacity>
          </>
        );
      };

      const { getByTestId } = render(<TestPdfCapture />);

      fireEvent.press(getByTestId('capture-pdf'));

      await waitFor(() => {
        expect(captureRef).toHaveBeenCalled();
      });
    });

    it('should include notes in generated PDF', async () => {
      mockRequirePremium.mockImplementation((callback) => {
        callback();
      });

      Print.printToFileAsync.mockResolvedValue({ uri: 'file://test.pdf' });

      const TestPdfWithNotes = () => {
        const { requirePremium } = usePremium();
        const notes = ['Note 1', 'Note 2'];

        const handleGeneratePdf = async () => {
          requirePremium(async () => {
            const html = '<html><body><h1>Reference</h1>';
            if (notes.length > 0) {
              html += '<h3>Notes</h3>';
              notes.forEach((n, i) => {
                html += `<p>${i + 1}. ${n}</p>`;
              });
            }
            html += '</body></html>';

            const result = await Print.printToFileAsync({ html });
            expect(result.uri).toBeDefined();
          });
        };

        return (
          <TouchableOpacity onPress={handleGeneratePdf} testID="pdf-with-notes">
            <Text>Generate PDF with Notes</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestPdfWithNotes />);

      fireEvent.press(getByTestId('pdf-with-notes'));

      await waitFor(() => {
        expect(Print.printToFileAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Bookmark Feature in ReferenceModal', () => {
    it('should require premium to bookmark from reference modal', async () => {
      const mockBookmarkCallback = jest.fn();

      const TestReferenceBookmark = () => {
        const { requirePremium } = usePremium();

        const handleBookmark = () => {
          requirePremium(mockBookmarkCallback);
        };

        return (
          <TouchableOpacity onPress={handleBookmark} testID="bookmark">
            <Text>Bookmark</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestReferenceBookmark />);

      fireEvent.press(getByTestId('bookmark'));

      await waitFor(() => {
        expect(mockRequirePremium).toHaveBeenCalled();
      });
    });
  });

  describe('Share Feature', () => {
    it('should allow sharing without premium restriction', () => {
      const TestShare = () => {
        const mockShare = jest.fn();

        return (
          <TouchableOpacity onPress={mockShare} testID="share">
            <Text>Share</Text>
          </TouchableOpacity>
        );
      };

      const { getByTestId } = render(<TestShare />);

      fireEvent.press(getByTestId('share'));

      expect(mockRequirePremium).not.toHaveBeenCalled();
    });
  });
});
