# V25 native Carlos QA and V26 visual response
Native run https://github.com/davidiaz03/remotion-production-hub-/actions/runs/38109486220
Git SHA b5565a2db5b5e92a9f66e4d8a4fd8210fa1dda49; global frames 1020-1089 (70), 1080x1920 at 30fps, H264+AAC. Actual 70/70, decode OK, zero unexpected black intervals. File SHA256 6d117444fc8e73bb98b61b9226c62535f0514c0810676e6bba9c233f77254348, bytes 858938. Native technical status passed; visual QA done on contact sheet and sample frame 30.

Visual result: real Carlos face clean in archive 16:9, institutional name/mark readable. Blurred atmosphere improves cohesion over V24 black void, but bottom remains too empty and does not earn attention. This is partial improvement, NOT approval of full edit. Source original 428x240 maintained.

V26 implementation: new VoiceWaveforms.ts provides 56 amplitude bins measured from verified original Carlos and Nancy WAVs at 48kHz; Video.tsx draws restrained dynamic signal bars and label 'VOZ ORIGINAL · ARCHIVO TESTIMONIAL' below the documentary window. This is sound data, NOT a transcript and does not claim historical quotes. Existing brand mark and music mixing unchanged. Code V26 not yet natively rendered or approved.

V25 MP4 backed up in Drive: https://drive.google.com/file/d/1RojZngYudZXEc07YxGZ3Ru21nFaW8MfP/view
Still required: verify semantic content of both spoken quotes, precise captions, editorial consent and full 55s continuity review. No master has been generated.
