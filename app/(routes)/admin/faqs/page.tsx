'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const FAQAdminPage = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newFAQ, setNewFAQ] = useState({ question: '', answer: '' });
  const [editFAQ, setEditFAQ] = useState<FAQ | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<FAQ | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const response = await fetch('/api/faqs');
        if (!response.ok) {
          throw new Error('Failed to fetch FAQs');
        }
        const data: FAQ[] = await response.json();
        setFaqs(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchFAQs();
  }, []);

  const handleCreateFAQ = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFAQ),
      });
      if (!response.ok) {
        throw new Error('Failed to create FAQ');
      }
      const createdFAQ: FAQ = await response.json();
      setFaqs((prevFAQs) => [...prevFAQs, createdFAQ]);
      setIsCreateDialogOpen(false);
      setNewFAQ({ question: '', answer: '' });
      toast({ title: 'FAQ created successfully' });
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'An unknown error occurred', variant: 'destructive' });
      }
    }
  };

  const handleEditFAQ = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editFAQ) return;
    try {
      const response = await fetch(`/api/faqs/${editFAQ.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: editFAQ.question, answer: editFAQ.answer }),
      });
      if (!response.ok) {
        throw new Error('Failed to update FAQ');
      }
      const updatedFAQ: FAQ = await response.json();
      setFaqs((prevFAQs) => prevFAQs.map((faq) => (faq.id === updatedFAQ.id ? updatedFAQ : faq)));
      setIsEditDialogOpen(false);
      setEditFAQ(null);
      toast({ title: 'FAQ updated successfully' });
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'An unknown error occurred', variant: 'destructive' });
      }
    }
  };

  const handleDeleteFAQ = async () => {
    if (!faqToDelete) return;
    try {
      const response = await fetch(`/api/faqs/${faqToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete FAQ');
      }
      setFaqs((prevFAQs) => prevFAQs.filter((faq) => faq.id !== faqToDelete.id));
      setIsDeleteDialogOpen(false);
      setFaqToDelete(null);
      toast({ title: 'FAQ deleted successfully' });
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'An unknown error occurred', variant: 'destructive' });
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>FAQ Management</h1>
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button>Add New FAQ</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New FAQ</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateFAQ}>
            <Input
              type="text"
              placeholder="Question"
              value={newFAQ.question}
              onChange={(e) => setNewFAQ((prev) => ({ ...prev, question: e.target.value }))}
              required
            />
            <textarea
              placeholder="Answer"
              value={newFAQ.answer}
              onChange={(e) => setNewFAQ((prev) => ({ ...prev, answer: e.target.value }))}
              required
            ></textarea>
            <Button type="submit">Create FAQ</Button>
          </form>
        </DialogContent>
      </Dialog>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Question</TableHead>
            <TableHead>Answer</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {faqs.map((faq) => (
            <TableRow key={faq.id}>
              <TableCell>{faq.question}</TableCell>
              <TableCell>{faq.answer}</TableCell>
              <TableCell>
                 <Button variant="outline" onClick={() => { setEditFAQ(faq); setIsEditDialogOpen(true); }}>Edit</Button>
                 <Button variant="destructive" onClick={() => { setFaqToDelete(faq); setIsDeleteDialogOpen(true); }}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit FAQ Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditFAQ}>
            <Input
              type="text"
              placeholder="Question"
              value={editFAQ?.question || ''}
              onChange={(e) => setEditFAQ((prev) => prev ? { ...prev, question: e.target.value } : null)}
              required
            />
            <textarea
              placeholder="Answer"
              value={editFAQ?.answer || ''}
              onChange={(e) => setEditFAQ((prev) => prev ? { ...prev, answer: e.target.value } : null)}
              required
            ></textarea>
            <Button type="submit">Save Changes</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete FAQ Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this FAQ?</p>
          <Button variant="destructive" onClick={handleDeleteFAQ}>Delete</Button>
          <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FAQAdminPage;
